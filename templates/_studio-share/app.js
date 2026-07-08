// Studio share — タブシェル。share.json を読んでタブを動的描画し、
// html タブは iframe で隔離（共有ヘッダとプロトの CSS が衝突しない）、
// markdown タブは整形＋目次（ToC）付きで表示する。
(async () => {
  const cfg = await fetch("./share.json").then((r) => r.json()).catch(() => null);
  const stage = document.getElementById("stage");
  if (!cfg) {
    stage.innerHTML =
      '<div class="err">share.json を読み込めませんでした。ローカルでは <b>http サーバ経由</b>で開いてください（file:// だと fetch がブロックされます）。</div>';
    return;
  }

  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  }

  // パスワードゲート（passwordHash があれば。内部共有を URL 直アクセスから守る。sha256 一致でローカルにキャッシュ）
  async function sha256(t) {
    const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t));
    return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  }
  async function passwordGate(hash) {
    const KEY = "studio-share-pw";
    const cached = localStorage.getItem(KEY);
    if (cached && (await sha256(cached)) === hash) return;
    await new Promise((resolve) => {
      const ov = document.createElement("div");
      ov.className = "pw-overlay";
      ov.innerHTML =
        '<form class="pw-box">' +
        '<div class="pw-lock"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></div>' +
        '<div class="pw-title">プロトタイプを表示</div>' +
        '<div class="pw-hint">パスワードを入力してください</div>' +
        '<input type="password" class="pw-input" placeholder="Password" autocomplete="off" autofocus />' +
        '<div class="pw-err">パスワードが違います</div>' +
        '<button type="submit" class="pw-submit">開く</button>' +
        "</form>";
      document.body.appendChild(ov);
      const form = ov.querySelector("form");
      const inp = ov.querySelector(".pw-input");
      const err = ov.querySelector(".pw-err");
      inp.focus();
      form.onsubmit = async (e) => {
        e.preventDefault();
        if ((await sha256(inp.value)) === hash) {
          localStorage.setItem(KEY, inp.value);
          ov.remove();
          resolve();
        } else {
          err.style.display = "block";
          inp.value = "";
          inp.focus();
        }
      };
    });
  }
  if (cfg.passwordHash) await passwordGate(cfg.passwordHash);

  // テーマ（プロジェクトのブランド色）を適用。未指定なら style.css の既定。
  if (cfg.theme) {
    const root = document.documentElement.style;
    if (cfg.theme.accent) root.setProperty("--accent", cfg.theme.accent);
    if (cfg.theme.accentStrong) root.setProperty("--accent-strong", cfg.theme.accentStrong);
    if (cfg.theme.accentSoft) root.setProperty("--accent-soft", cfg.theme.accentSoft);
    if (cfg.theme.font) root.setProperty("--font", cfg.theme.font);
  }

  // パンくず: list があれば「一覧 / タイトル」、無ければタイトルのみ。
  let crumb = "";
  if (cfg.list && cfg.list.url) {
    crumb += '<a class="crumb-link" href="' + esc(cfg.list.url) + '">' + esc(cfg.list.label || "一覧") + "</a>";
    crumb += '<span class="crumb-sep">/</span>';
  }
  crumb += '<span class="crumb-current">' + esc(cfg.title || "") + "</span>";
  document.getElementById("crumbs").innerHTML = crumb;
  document.title = cfg.title || "Share";

  const meta = [];
  if (cfg.author) meta.push('<span class="meta-item"><span class="meta-k">作成者</span>' + esc(cfg.author) + "</span>");
  if (cfg.updatedAt) meta.push('<span class="meta-item"><span class="meta-k">最終更新</span>' + esc(cfg.updatedAt) + "</span>");
  document.getElementById("meta").innerHTML = meta.join("");

  const tabsEl = document.getElementById("tabs");
  const panes = {};

  cfg.tabs.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "tab";
    btn.textContent = t.label;
    btn.dataset.id = t.id;
    btn.onclick = () => activate(t.id);
    tabsEl.appendChild(btn);

    const pane = document.createElement("div");
    pane.className = "pane";
    pane.dataset.id = t.id;
    if (t.type === "html") {
      const f = document.createElement("iframe");
      f.dataset.src = t.src; // lazy
      f.title = t.label;
      // 同一オリジンの iframe にもショートカットを効かせる（デザイン案を見ている時もタブ移動できる）
      f.addEventListener("load", () => {
        try {
          f.contentDocument.addEventListener("keydown", onKey);
        } catch (_) {}
      });
      pane.appendChild(f);
    } else {
      const wrap = document.createElement("div");
      wrap.className = "md-wrap";
      const toc = document.createElement("nav");
      toc.className = "toc";
      const art = document.createElement("article");
      art.className = "md";
      art.dataset.src = t.src;
      art.dataset.loaded = "0";
      wrap.appendChild(toc);
      wrap.appendChild(art);
      pane.appendChild(wrap);
    }
    stage.appendChild(pane);
    panes[t.id] = pane;
  });

  // ショートカットのヒント（タブバー右端）
  const hint = document.createElement("span");
  hint.className = "tab-hint";
  hint.textContent = "Shift ← →";
  hint.title = "タブ移動: Shift+← / Shift+→（または [ / ]）";
  tabsEl.appendChild(hint);

  // --- タブ移動ショートカット（ブラウザ標準と非衝突: Shift+←/→ または [ / ]）---
  function moveTab(delta) {
    const ids = cfg.tabs.map((t) => t.id);
    let i = ids.indexOf(document.querySelector(".tab.active")?.dataset.id);
    if (i < 0) i = 0;
    activate(ids[(i + delta + ids.length) % ids.length]); // 端は循環
  }
  function onKey(e) {
    const tag = (e.target?.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || e.target?.isContentEditable) return; // 入力中は無効
    const plain = !e.metaKey && !e.ctrlKey && !e.altKey; // Cmd/Ctrl+[ ] は戻る/進むなので除外
    if ((e.shiftKey && e.key === "ArrowRight") || (plain && e.key === "]")) {
      e.preventDefault();
      moveTab(1);
    } else if ((e.shiftKey && e.key === "ArrowLeft") || (plain && e.key === "[")) {
      e.preventDefault();
      moveTab(-1);
    }
  }
  document.addEventListener("keydown", onKey);

  // markdown 本文から h2/h3 を拾って目次を組む
  function buildToc(art, toc) {
    const heads = art.querySelectorAll("h2, h3");
    if (!heads.length) {
      toc.style.display = "none";
      return;
    }
    toc.innerHTML = '<div class="toc-title">目次</div>';
    let n = 0;
    heads.forEach((h) => {
      if (!h.id) h.id = "h-" + n++;
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      a.className = "toc-link toc-" + h.tagName.toLowerCase();
      a.onclick = (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      toc.appendChild(a);
    });

    // スクロールスパイ: 現在地のセクションを目次で常時ハイライト
    const pane = art.closest(".pane");
    const headEls = [...heads];
    const links = new Map();
    toc.querySelectorAll(".toc-link").forEach((a) => links.set(a.getAttribute("href").slice(1), a));
    let cur = null;
    function spy() {
      const line = pane.getBoundingClientRect().top + 96; // ペイン上端から約96px下を判定ライン
      let active = headEls[0];
      for (const h of headEls) {
        if (h.getBoundingClientRect().top <= line) active = h;
        else break;
      }
      const id = active && active.id;
      if (id === cur) return;
      cur = id;
      links.forEach((a) => a.classList.remove("active"));
      const a = links.get(id);
      if (!a) return;
      a.classList.add("active");
      // アクティブリンクが目次の表示範囲外なら、目次だけをスクロール（ページは動かさない）
      const tr = a.getBoundingClientRect();
      const cr = toc.getBoundingClientRect();
      if (tr.top < cr.top || tr.bottom > cr.bottom) {
        toc.scrollTop += tr.top - cr.top - cr.height / 2 + tr.height / 2;
      }
    }
    pane.addEventListener("scroll", spy, { passive: true });
    spy();
  }

  function activate(id) {
    document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("active", b.dataset.id === id));
    Object.entries(panes).forEach(([k, p]) => p.classList.toggle("active", k === id));
    const pane = panes[id];
    if (!pane) return;
    const f = pane.querySelector("iframe");
    if (f && !f.src) f.src = f.dataset.src;
    const art = pane.querySelector(".md");
    if (art && art.dataset.loaded === "0") {
      art.dataset.loaded = "1";
      fetch(art.dataset.src)
        .then((r) => r.text())
        .then((md) => {
          art.innerHTML = window.marked ? window.marked.parse(md) : "<pre>" + esc(md) + "</pre>";
          buildToc(art, pane.querySelector(".toc"));
        })
        .catch(() => {
          art.innerHTML = '<div class="err">読み込みに失敗しました（http サーバ経由で開いてください）。</div>';
        });
    }
    if (history.replaceState) history.replaceState(null, "", "#" + id);
  }

  const initial = (location.hash || "").slice(1);
  activate(cfg.tabs.some((t) => t.id === initial) ? initial : cfg.tabs[0].id);
})();
