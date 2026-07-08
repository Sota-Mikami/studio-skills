---
description: デザイン issue を1コマンドで自律実行（Recon→ヒアリング→仮Spec→パターン→実装→出力）
---

# /studio:issue — デザインループ・オーケストレータ

> **ループ内の位置**: 入口（唯一）。P0→P6 を自律駆動する。
> **いつ選ぶ**: 「デザイン改善 / 新規デザイン」の issue を始める時。些末な1点修正なら直接 `/studio:implement`。
> **前提（必読）**: 開始時にまず **`~/.claude/studio/DOCTRINE.md`（正本）を読む**。**フェーズ規律（毎ターン Phase X/6 宣言・弱点3つ）・ゲート/フェーズ省略ルール・「発見」（profiles 3層）・実デザイン再現・忠実度の作り方・自動ログ＋spec 同期・出力の分岐は、すべて DOCTRINE の該当節に従う**（本ファイルには再掲しない）。どのプロジェクトでも動くよう、特定のプロジェクトに決め打ちしない。

**施策の特定（タイトルを二重入力しない）**: 引数 **$ARGUMENTS** があればそれを使う。無ければ worktree が持つ情報から自動で引き継ぐ — `git branch --show-current`／紐づく GitHub・Linear の issue・PR（`gh issue view` / `gh pr view`）／`.studio/state.md`／直近のコミット・差分。Phase 0 冒頭で「**この worktree は〈…〉と理解しました**」と一言述べて進む（明らかに違えば本人が訂正・それ以外は止まらない）。

## 各フェーズ（規律は DOCTRINE、ここはオーケストレータ固有の手順のみ）

- **P0 Assess & Recon（自律・止まらない）** — `.studio/` を用意（`state.md`/`CHANGELOG.md`/`design/`/`research/`）し、CHANGELOG に開始行を追記（以後全フェーズで更新）。タスク性質を判定し、飛ばせそうなフェーズは**提案に留める**（省略は人間確認＝DOCTRINE ゲート規律）。発見は **DOCTRINE §「発見」**（profile 読む → 安価な差分チェック → 穴埋めのみ。無ければフル発見して profile 新規作成）。**issue 該当画面の component は profile があっても毎回読む**。必要なら best-practice を自律リサーチ（`.studio/research/`）。最後に現状の要点を3〜5行で述べる。
- **P1 Hearing（ゲート）** — **AskUserQuestion** で、P0 を踏まえた現実的で回答容易な質問を論点ごとに（記入を求めない）。自明な所は仮置きして「こう仮定した」と述べる。（単体実行: `/studio:hearing`）
- **P2 仮 Spec（ゲート無し）** — `.studio/spec.md` を 背景/目的 → 要件 → 受入基準（観察可能=Done）→ やらないこと で書き、弱点3つで自己点検。**テキスト承認は取らず P3 へ**。（詳細: `/studio:spec`）
- **P3 パターン（ゲート）** — `/studio:design` の方針で **3-5 案を1枚の動く HTML**（`.studio/design/NN-slug.html`）。見た目は **DOCTRINE §実デザイン再現**（グレースケール禁止）。各案にラベル＋トレードオフ1行 → 自己批評 → **AskUserQuestion で採用案を聞く**。
- **P4 実装（既定で実施）** — 採用案を**実 repo の本物のコード**で実装（HTML 案は使い捨て探索）。忠実度は **DOCTRINE §忠実度の作り方**（実画面を実ルートで動かす・dev auth bypass・mock 拡充。500/空は `/studio:doctor`）。**作り切ったら localhost(dev) を起動し、URL を添えて「確認してください」と促す**。実装前に毎回 spec を読み直す（living spec）。（詳細: `/studio:implement`）
- **P5 継続（横断・常時・自動）** — **DOCTRINE §自動ログ＋spec 同期**。区切りで `/studio:verify`・`/studio:review` を自分の判断で挟む。
- **P6 Output（分岐・ゲート）** — **DOCTRINE §出力の分岐**（チーム repo=Share → `/studio:share`／個人 repo=Ship → `/studio:ship`）。迷えば AskUserQuestion で聞く。

**完了の宣言**: フェーズ移行時に `.studio/state.md` を更新し、現在地（Phase X/6・済み・次）を一言で示す。
