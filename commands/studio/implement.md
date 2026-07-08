---
description: 採用方向を実コードで実装し、"既存の実画面を動かして"忠実度を作り込む（dev mock 環境・P4）
---

> ドクトリン正本: `~/.claude/studio/DOCTRINE.md`（studio ループの規律。未読ならまず読む）

# /studio:implement — 実コード実装＋実画面で忠実度（P4）

> **ループ内の位置**: P4（パターン採用後）。「**Phase 4 を改めて進めて**」「実装して」「コードにして」でも発火。
> **大原則**: **"再現"しない。** 別の proto に component を作り直すと忠実度は必ず落ちる。worktree には**実 repo のコードとあなたの変更がそのまま**入っている → **該当の"実画面そのもの"を実ルートで動かす**のが最高忠実度。
> **env/login を毎回ユーザーに要求しない**。要らない部分（auth/backend）は dev だけ外す。

## 1. 実装（実 repo の本物で）
- 実装前に `.studio/spec.md` を読み直す（**living spec**）。
- **実 repo の UI ライブラリ・トークン・既存コンポーネント**で実装（standalone HTML を作り込まない）。HTML 案は方向選び用の使い捨て。

## 2. 確認は「既存の実画面を動かして」（proto に作り直さない）
該当の**実画面・実ルートをそのまま起動**して見る。**要らない部分（auth/backend）だけ dev で外す**。まず **repo プロファイル（`~/.claude/studio/profiles/<slug>.md`）を読む** — auth スキップ手順・mock 基盤・dev の罠が記録済みならそのまま使う。無ければこの repo を発見（認証の仕組み・データ取得層・dev フラグ・dev コマンド）。dev で外す処置は**全て dev フラグ配下＝本番では発火しない**設計に。

- **まず: そのまま動くなら、それで終わり**。**認証/backend 依存が無い画面**（個人プロジェクト・公開ルート等）は dev を起動して実ルートを開くだけ。下の (a)(b) は**依存がある時だけ**（過剰構築しない）。
- **(a) 認証スキップ（ログインが不要なら）**: repo の既存 dev フラグ配下で、
  - 認証 Provider が key 必須でコケるなら dev はダミー値でマウント（本番は実値のフォールバック）。
  - sign-in リダイレクト（middleware の `auth.protect()` 等）を dev だけスキップ。
  - `isSignedIn` 等でレンダ/データ取得をゲートしている箇所に **dev signed-in バイパス**（`devFlag || isSignedIn`）。必要なら user store に mock user を流す。
- **(b) データ mock（必要に応じて拡充）**: API 層（GraphQL/REST 等）を **mock で intercept**（MSW 等。既存 mock/fixture 基盤があればそれ）。**その画面が要る分の fixture だけ**返し、足りなければ足す。
- **(c) 起動**: 発見した dev コマンド（**turbopack でコケるなら non-turbo**）→ **実ルートをそのまま開く**。「Running なのに空/500/404」は `/studio:doctor`。

> repo ごとの具体手順（dev フラグ名・ゲートの場所・mock endpoint 等）は **repo プロファイル（`~/.claude/studio/profiles/<slug>.md`）に記録**する。プロジェクトごとにスタックが違うので**機構ごと発見し直す**（auth 無しなら丸ごと不要）。
> **書き戻し（重要）**: dev mock 環境・Storybook バンドル手順・罠を**新しく確立したら、その場で profile に追記**し `最終確認日` を更新（次の issue が即使える）。

## 3. localhost で確認を促す → 反復＋ログ
- **一定まで自分で作り切ったら、localhost(dev) を起動し、開く URL を添えて「確認してください」と促す**（実装しただけで止めない＝**実画面が動く状態で渡す**）。
- その上で**ユーザーの修正指示で反復**。修正のたびに `/studio:log`（CHANGELOG 追記＋spec 同期）を**指示されなくても自動で**（CHANGELOG は **P0 から常時**更新）。
- **commit はしない**（人間が Orca / git で行う）。
- 本物の env/backend/login を要求するのは**最後の手段**（本物データでの最終確認時だけ・**必ず確認してから**）。

## 4. 共有に載せる（P6・任意・`/studio:share`）
実装した**実画面を issue のページだけスコープ**して共有の1タブに。**手書き HTML で作り直さない**（＝再現・別コード・見た目が変わる）:
- **interactive 実コードタブ（触れる本物・最優先）**: issue のページを実コードのまま動かして載せる —
  - **Storybook（Vite ベースがあれば最有力・実証済み）**: **実コンポーネントを import した story** を書き、Storybook を静的ビルド（`base:'./'` で相対アセット）→ **素の story（`iframe.html?id=…&viewMode=story`）** を share の iframe タブに。＝再現でなく実コードが触れる静的バンドル。**ページ相当にしたいなら実 shell（Sidebar/Header）も story に組む**。実装が無い案（未実装 variant）は実コードにできない → **先に P4 で実装**してから story 化。`.storybook/main.ts` を一時 narrow したら**必ず revert**（共有 config を汚さない）。確認は"触って"（実トグル→実コンポーネントが更新）。
  - **static export**: `output:'export'`＋**MSW 同梱**で静的ビルド。App Router の複雑 app は全 export 制約で詰まりやすい（→ Storybook が実質の代替）。
  - **preview deploy**: 実 app を Next 対応ホスト（Vercel preview 等）に dev フラグ付きでデプロイ → その URL を iframe タブに（＝実 app そのもの・最も忠実・**多ページ/full-shell を出したい時**向き）。
- **触れなくてよい時**: 動かした実画面の**スクショ / 画面録画（動画）**。**手書き HTML には逃げない**（不忠実）。
