---
description: 共有/プレビューUIを「都度目視」でなくブラウザ自動操作で毎回同じルールで機械検証（UIテスト規約・受け手前の必須ゲート）
---

> ドクトリン正本: `~/.claude/studio/DOCTRINE.md`（studio ループの規律。未読ならまず読む）

# /studio:ui-test — UI テスト・ワークフロー（受け手に出す前の必須ゲート）

> **ループ内の位置**: P6 の直前（ローカルで）と直後（本番URLで）。`/studio:share` / `/studio:ship` の出力を受け手に渡す前に**必ず**通す。
> **原則**: **目視に頼らない**。DOM / console / network を読んで**機械的に assert** する。ローカル（`http://localhost:PORT/`）で先に潰し、本番URLで仕上げ確認。
> **道具**: claude-in-chrome（`navigate` / `javascript_tool` / `read_page` / `read_console_messages`）。tab が無ければ `tabs_context_mcp` → `tabs_create_mcp`。
> **既知の罠**: ハッシュだけ違う URL へ navigate しても**リロードされない**。`?r=<n>` 等クエリを変えて完全リロードする。

## 進め方
対象URLを1つ受け取り、下の規約を上から assert → **PASS/FAIL 表**で返す。FAIL は**原因＋修正案**を添える。全PASSで初めて「受け手に出してよい」。

## 検証規約（studio share タブシェル）

### [A] 配信・堅牢性
- 主要アセットが **HTTP 200**（index / app.js / style.css / marked.min.js / share.json / 各 content）。
- **外部CDNリクエスト 0**: `performance.getEntriesByType('resource')` が同一オリジンのみ（外部があると CDN 障害でハングし得る）。
- **console エラー 0**（`read_console_messages`）。

### [B] ログイン（share.json に `passwordHash` がある時）
- ゲート（`.pw-overlay`）が出て、**入力欄＋送信ボタンの両方**が在る（**ボタンが無いのは FAIL**）。card/lock/title/hint が揃い簡素すぎない。
- 誤PW → エラー表示・**コンテンツ未構築**（`.tab` が 0）。
- 正PW → **Enter と 送信ボタンの両方**で解錠しタブ構築。**解錠後リロードで再表示しない**（localStorage キャッシュ）。

### [C] タブ
- share.json の**全タブが描画**。クリックで `.active` 切替。
- `type:"html"` タブは **iframe で隔離**ロード（`.pane.active iframe[src]` が在り、中身が親 DOM に漏れない＝共有ヘッダと CSS 衝突なし）。

### [D] Markdown タブ
- 整形描画＋**目次**。スクロールで**現在地ハイライト** `.toc-link.active` が追従（先頭→中間→末尾で変わる）。

### [E] パンくず
- `一覧 / タイトル`。`list` 有→「一覧」が正しい URL のリンク、無→タイトルのみ（**崩れない**）。

### [F] 一覧掲載（デプロイ時のみ・最重要の見落とし）
- **キャッシュバスター付き**で本番 landing を開き、当該 proto が **title / description / createdAt / updatedAt** 付きの**行**で出る。
- **行クリックで proto 詳細へ遷移**できる（`data-href="./{name}/"`）。
- 出ない時の一次容疑＝**キャッシュ**（landing は `?v=Date.now()`+`no-store` で fetch、deploy は prototypes.json を invalidate、必要なら `/app.js` も invalidate）。次に prototypes.json の登録漏れ／`archived:true`／フィールド欠落を疑う。

### [G] レイアウト隔離
- 共有ヘッダとプロト本体が崩れていない（iframe 隔離が効いている）。

### [H] タブ移動ショートカット（標準キーと非衝突）
- `Shift+←/→`（および `[` / `]`）で前後タブに移動。**`Cmd/Ctrl+[ ]` は無視**＝ブラウザの戻る/進むを壊さない。
- 入力中は無効、**iframe フォーカス中でも効く**（同一オリジンに注入）。タブバー右端にヒント。
- 検証: `document.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true}))` で `.tab.active` が次へ動く。`{key:']',metaKey:true}` では**動かない**こと。

## アサート例（javascript_tool）
```js
const cs=getComputedStyle(document.documentElement);
JSON.stringify({
  ext: performance.getEntriesByType('resource').filter(e=>!e.name.startsWith(location.origin)).length, // [A] 0 が PASS
  gate: !!document.querySelector('.pw-overlay'), submit: !!document.querySelector('.pw-submit'),        // [B]
  tabs: document.querySelectorAll('.tab').length, iframeLoaded: !!document.querySelector('.pane.active iframe[src]'), // [C]
  tocActive: document.querySelector('.toc-link.active')?.textContent,                                   // [D]
  crumb: document.querySelector('.crumb-current')?.textContent, crumbHref: document.querySelector('.crumb-link')?.href, // [E]
  accent: cs.getPropertyValue('--accent').trim()                                                        // テーマ反映
});
```

## 出力フォーマット
| # | 規約 | 結果 | 根拠/原因 |
|---|---|---|---|
| A | 配信・堅牢性 | PASS/FAIL | … |
| … | … | … | … |

全PASS → 「受け手に共有してよい」。FAIL があれば直して再実行。
