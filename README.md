# studio-skills

> **Archived (2026-11-01).** This repository is no longer maintained and is kept public for reference only.
> **アーカイブ済み（2026-11-01）**：このリポジトリは更新していません。参考のために公開したままにしています。

**Claude Code の skill だけで「デザインループ」を回す**ための skill 群とドクトリンです。

デザイン施策（issue）1つを、**1コマンドで**次のループに乗せます:

```
/studio:issue（引数なしでOK）
  → P0 repo を読む（デザイントークン・画面・起動方法を発見）
  → P1 答えやすい質問でヒアリング
  → P2 仕様の仮まとめ（.studio/spec.md）
  → P3 Lo-fi: 方向性の違う案を動くHTMLで3〜5案 → 選ぶ
  → P4 High-fi: 採用案を本番コードで実装 → localhost で確認
  → P6 チーム共有（タブシェル）or 本番反映
（P5: 変更ログと spec は最初から最後まで自動で更新され続ける）
```

## 考え方（3行）

1. **再現しない。実物を動かす** — プロトタイプの忠実度が最も高いのは本番コード。worktree の実コードをそのまま動かして検証・共有する（HTML モックは方向選び用の使い捨て）。
2. **コードが正本** — DESIGN.md やデザインシステム基盤を整備しなくても、既存 repo からトークン・コンポーネント・規約を「発見」して使う。
3. **Lo-fi と High-fi を分ける** — 方向性を示すプロトタイプ（Lo-fi HTML）と、デザイン意図が伝わる実装（High-fi ＝本番コード）を分けて両方作る。

## 前提

- **AI コーディングエージェント** — リファレンス実装は [Claude Code](https://claude.com/claude-code)（動作確認済み）。**他のエージェントでも使えます** → [他の AI エージェントで使う](#他の-ai-エージェントで使う)
- git worktree ベースで施策ごとに作業場を切る運用（[Orca](https://www.onorca.dev/) が使いやすいです）
- **Web プロジェクト**（Next.js / Remix 等で動作確認。iOS/Android は現状対象外）
- 既存プロダクトのコードが（ある程度）整っていること — 「コードが正本」方式の前提です

あると便利（任意）:
- `gh` CLI — issue/PR から施策タイトルを自動で引き継ぐのに使います
- ブラウザ操作ツール（Claude Code なら Claude in Chrome）— `/studio:ui-test` の自動検証用。無ければ手動確認で代替できます

## セットアップ（4ステップ）

```bash
# 1. skill を配置（1ファイル = 1コマンド。/studio:issue などになる）
mkdir -p ~/.claude/commands/studio ~/.claude/studio/templates
cp commands/studio/*.md ~/.claude/commands/studio/

# 2. ドクトリン（ループの規律の正本）を配置
cp doctrine/DOCTRINE.md ~/.claude/studio/DOCTRINE.md

# 3. 共有テンプレ（タブシェル）を配置
cp -r templates/_studio-share ~/.claude/studio/templates/_studio-share

# 4. 対象 repo で、作業フォルダ .studio/ をローカルの gitignore に足す（repo を汚さない）
#    ※ worktree の中で実行してもOKな書き方。repo ごとに1回でOK（全 worktree に効く）
cd <your-repo>
echo ".studio/" >> "$(git rev-parse --git-path info/exclude)"
```

### はじめて回すとき（1本目の流れ）

1. 施策用の worktree（またはブランチ）を作る — Orca なら issue を作るだけ
2. その worktree でエージェントを開き、`/studio:issue` を実行（**引数なしでOK** — ブランチ名や紐づく issue から施策を推定します）
3. 質問に答える（P1）→ HTML の案から選ぶ（P3）→ localhost で実装を確認（P4）
4. 「シェアして」と言う（P6）— 共有先のホスティング（S3 / GitHub Pages / Vercel 等）の**初回設定だけは環境ごとに違う**ので、そのままエージェントに相談してください

つまずいたら: dev サーバが「起動しているのに 500/404」→ `/studio:doctor`。

### 最小構成で始める

全部入れなくても動き出せます。まずは **DOCTRINE ＋ 4本**がおすすめ:

- `issue.md`（入口・オーケストレータ）
- `design.md`（Lo-fi パターン出し）
- `implement.md`（High-fi 実装）
- `share.md`（チーム共有）

## skill 一覧

| skill | 役割 |
|---|---|
| `/studio:issue` | 入口。P0〜P6 を自律駆動するオーケストレータ |
| `/studio:hearing` | repo の現状を踏まえた、答えやすいヒアリング（P1） |
| `/studio:spec` | 要件定義 → `.studio/spec.md`。既存なら実装と同期（P2） |
| `/studio:design` | 実デザインをラフ再現した動くパターン 3〜5 案（P3） |
| `/studio:alt3` | 早期の構造ラフ3案（グレースケール） |
| `/studio:states` | エッジ状態（Empty/Error/…）を受入基準に落とす |
| `/studio:research` | 調査・比較を短いレポートに残す |
| `/studio:implement` | 本番コードで実装し、実画面を動かして忠実度を作る（P4） |
| `/studio:doctor` | dev が「起動してるのに 500/404」の原因切り分け |
| `/studio:log` | CHANGELOG 追記＋spec 同期（自動の実体・P0 から常時） |
| `/studio:review` | 批評的セルフレビュー（弱点3つ＋受入基準カバレッジ） |
| `/studio:verify` | 受入基準の直下に実装根拠を1行ずつ付す |
| `/studio:precommit` | 型・lint・動作の事前チェック |
| `/studio:share` | 共有テンプレ（タブシェル）でチーム共有（P6） |
| `/studio:ship` | 個人プロジェクト向け・本番反映まで（P6） |
| `/studio:ui-test` | 共有物をブラウザ自動操作で機械検証してから渡す |

## 共有テンプレ（`templates/_studio-share/`）

仕様（markdown・目次つき）／デザイン案（HTML）／触れる実装（iframe）を**タブで切り替える1枚の共有ページ**にする軽量シェルです。プロジェクト差分は `share.json`（テーマ色・一覧リンク・タブ構成）だけ。詳細は [`templates/_studio-share/README.md`](templates/_studio-share/README.md)。

共有先のホスティング（S3 / GitHub Pages / Vercel 等）の設定はプロジェクトごとに違うので、お使いの AI に聞いてください（本当にそれで組めます）。

## 他の AI エージェントで使う

skill の実体は**素の markdown（プロンプト＋手順書）**なので、Claude Code 以外のエージェント（Codex / Cursor / Gemini CLI 等）でも使えます。読み替えは4点だけ:

| Claude Code の要素 | 他エージェントでの読み替え |
|---|---|
| `~/.claude/commands/studio/*.md`（スラッシュコマンド化） | エージェントのカスタムコマンド/プロンプト置き場に配置（例: Codex は custom prompts、Cursor は Rules）。仕組みが無ければ「`commands/studio/issue.md` を読んで、その通りに進めて」と指示するだけでも動きます |
| `$ARGUMENTS`（コマンド引数の記法） | エージェントの引数記法に合わせる。引数なし運用（ブランチ名から施策を推定）ならそのままでOK |
| `AskUserQuestion`（選択肢で答えられる質問UI） | 「番号付き選択肢のテキスト質問」に読み替え。skill が期待している体験は**"選ぶだけで答えられる"こと**なので、そこが保てれば形式は自由 |
| `~/.claude/studio/DOCTRINE.md` 等のパス参照 | エージェントが読める任意の場所に置き、skill 内のパスを一括置換 |

※ 動作確認済みの組み合わせは Claude Code（＋Orca）のみです。他エージェントでの動作報告・改善 PR は歓迎します。

## 現在地（正直な注記）

- 作者（PdM & デザイナー）が自分の環境で回しながら育てている **n=1 の方法論**です
- Web プロジェクト前提（SwiftUI / Jetpack Compose はブラウザで動かせないため、iOS/Android の「触れる共有」は未対応）
- 背景や考え方はこちらの記事にまとめています → ［記事リンク］

## License

MIT
