---
description: プレビューが「Running なのに中身が出ない/500/404」原因を切り分けて直す
---

> ドクトリン正本: `~/.claude/studio/DOCTRINE.md`（studio ループの規律。未読ならまず読む）

## プレビュー修復（preview doctor）
プレビュー（dev サーバー）が「起動しているのに中身が出ない・500・404」になっています。dev サーバーのログ出力を読み、原因を切り分けて、このローカル/worktree dev で表示できるよう直してください。

次の「よくある原因」を切り分けてください（このローカル/worktree dev で SSR が出ない典型）:
- **env 不足/空**: `.env` / `.env.local` に必要な値があるか（`NEXT_PUBLIC_*`・認証キー・API/GraphQL/REST エンドポイント等）。`process.env.X` を参照しているのに未設定で落ちていないか。
- **認証ゲート**: 未ログインでルートが 404/リダイレクトしていないか。未認証はサインインか公開ルートへ素直に流す（例: Clerk なら `auth.protect({ unauthenticatedUrl: '/sign-in' })`）。
- **プロキシ/ポート**: 到達不能な宛先へ proxy していないか（例: `http://localhost`(=80) や別ホスト・ハードコードされたポート）。ログの『Failed to proxy …』『ECONNREFUSED』を確認。
- **バックエンド未起動**: SSR/データ取得が API/GraphQL/DB に依存し、この dev 環境でそれが起動していない。
- **Node バージョン/依存**: `node -v` が `engines`/`.nvmrc` と一致するか、`node_modules` は入っているか。

> **認証ゲート / backend 未起動が原因なら**、その場しのぎでなく P4 の **dev mock 環境（auth-skip＋mock data・`/studio:implement`）** で恒久回避するのが本筋（doctor は応急処置）。

制約（重要）:
- **最小の変更**でローカル/worktree dev が表示できるようにする。
- dev 専用の設定は **`.env.local`（gitignore）** に置き、**コミット対象のコードに混ぜない**。
- コード修正が要る場合も**焦点を絞る**。**いま進行中の issue と無関係なら別の関心事として切り分け**、この issue の変更に混ぜない（PR を綺麗に保つ）。
- アプリの**挙動を必要以上に変えない**。
- 原因が**環境要因**（ユーザーが用意すべき backend/secret 等）なら、コードを無理に直さず **何を設定/起動すべきかをユーザーに伝える**。
- 最後に **変えた点 / ユーザーが用意すべき点** を簡潔に要約する（commit は人間が行います）。
