---
description: spec/wire/実画面スナップショットを共有テンプレ（タブシェル）で高忠実に共有（チーム向け・P6 Share）
---

> ドクトリン正本: `~/.claude/studio/DOCTRINE.md`（studio ループの規律。未読ならまず読む）

# /studio:share — ステークホルダー共有（P6・Share モード）

> **ループ内の位置**: P6（**チーム repo の出力**＝他者レビューがアウトプット）。
> **いつ選ぶ**: 他のメンバーに見てもらう時。個人 repo の本番反映は `/studio:ship`。
> **原則**: 忠実度の鍵は「**何を配るか**」。**手書き HTML で UI を作り直して "共有" にしない**（＝再現・別コード・見た目が必ず変わる）。実装を載せるなら **(1) 実コードそのものを動かして載せる**（static export / preview deploy を iframe）か **(2) 実画面をキャプチャ**（スクショ/動画）。**手書き HTML は P3 探索専用**。「触れる本物が出せない」時は手書き HTML でなく**動画**にする（動画は忠実・手書きは不忠実）。

## 1. 共有先・テンプレ・index を発見（決め打ちしない）
まず **repo プロファイル（`~/.claude/studio/profiles/<slug>.md`）** — 共有先・テンプレ位置・theme・deploy 手順が記録済みならそのまま使う。無ければ発見: そのエリアの CLAUDE.md のホスティング規約、repo の既存の共有/proto 機構（**共有テンプレ**・manifest・landing・deploy）→ **profile に書き戻す**。
テンプレの優先順: **①エリアの共有テンプレ**（repo/エリアに既にあれば）→ **②無ければ正本 `~/.claude/studio/templates/_studio-share/` からコピー**してエリアに置き、`share.json`（theme/list）だけ設定＝**新規プロジェクトでも初回から共有が立つ**。

## 2. 共有内容を柔軟に選ぶ（任意の組合せ）
- (a) `.studio/spec.md`（整形して表示）
- (b) `.studio/design/*.html`（P3 のラフワイヤー/パターン）
- (c) **実画面の静的スナップショット**（P4 の実画面を自己完結 HTML に＝高忠実・フリーズ画像）
- (d) **interactive 実コードタブ**（P4 の実画面を `output:'export'`＋MSW 同梱で静的ビルド＝React が動く・実コード・mock データで触れる本物）

## 3. (c)(d) のもと＝P4 の dev mock 環境で実画面を動かす（ログイン不要）
P4 と同じ **dev mock 環境（auth-skip＋mock data）** で**該当の実画面・実ルートを動かす**（"ログイン済み dev" を前提にしない）。
- **(c) 静的スナップショット**: 動いた実画面で、アプリ外 UI（ナビ / dev overlay / ログイン要素 / バッジ等）を非表示にし、DOM＋CSS（画像/フォント）を inline 化した**自己完結 HTML**に。既存 capture スクリプトがあれば流用。
- **(d) interactive 実コードタブ**: **issue のページだけスコープ**して `output:'export'` で静的ビルドし、**MSW を同梱**（静的でも mock が効く）。React が動く実コードのまま静的ホスティングに置ける。
- 受け手はどちらも**ログイン不要・本物**。

## 4. テンプレに流し込む（`_studio-share/` タブシェル）
そのエリアの汎用シェル `_studio-share/`（`index.html`/`app.js`/`style.css`/`marked.min.js`）を新フォルダにコピーし、**差分だけ**書く（シェルは触らない）:
- **`share.json` を作る**（プロジェクト差分はここだけ）:
  - `title` / `author` / `updatedAt` — ヘッダのパンくず現在地＋「作成者・最終更新」。
  - `list`: プロトタイプ一覧ページへのパンくず `{label,url}`。一覧 URL は**プロジェクトごとに違うので発見して入れる**（例: S3+CloudFront のルート / GitHub Pages のルート）。**一覧が無いプロジェクトは `list` を省略**＝タイトルのみで成立。
  - `theme`: ブランド色 `{accent,accentStrong,accentSoft}` を**repo の design tokens から拾って**入れる。**色はハードコードしない**＝同じシェルが config で各プロジェクト色になる。
  - `tabs`: 出すタブ `[{id,label,type:"markdown"|"html",src}]`。**markdown=整形＋目次(ToC)**、**html=iframe 隔離**（プロト/スナップショットの header/sidenav を崩さない）。issue ごとに増減自由。
- **`content/`** に (a)spec.md / (b)design *.html / (c)実画面スナップショット を置き、`tabs[].src` で指す。
- 動的タブ・iframe 隔離・パンくず・目次・自己完結（外部 CDN 非依存＝ハングしない）はシェルが担保。`python3 -m http.server` でローカル確認（`file://` は不可）。

## 5. publish & 登録
ホスティングに publish → **共有 index（manifest）に登録**（title / description / author / createdAt / updatedAt / tags。一覧で行表示＋クリックで遷移できるよう必須フィールドを埋める）→ `.studio/CHANGELOG.md` に記録する。

## 6. UI テスト（受け手に出す前の必須ゲート）
**目視で都度確認せず** `/studio:ui-test` を通す（ローカル→本番URL）。最低限: **一覧に title/説明/日付付きで出て・クリックで proto を開ける**／**ログインに送信ボタンがあり Enter とボタン両方で解錠**／タブ・iframe隔離・目次スクロールスパイ・パンくず・console無エラー・外部CDN 0。**全PASSで初めて共有 URL を渡す**。一覧に出ない時の一次容疑はキャッシュ（landing は cache-buster fetch、deploy は prototypes.json を invalidate）。
