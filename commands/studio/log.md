---
description: 変更を .studio/CHANGELOG.md に追記し spec を同期（自動・指示不要の実体）
---

> ドクトリン正本: `~/.claude/studio/DOCTRINE.md`（studio ループの規律。未読ならまず読む）

# /studio:log — 変更ログ＋spec 同期（横断・P0 から常時）

> **ループ内の位置**: 横断（**P0 から全フェーズ**・`CHANGELOG.md` は P0 で作成）。ドクトリンにより**指示されなくても毎回**走る想定。手動でも呼べる。
> **いつ選ぶ**: フェーズ移行・ユーザーの修正指示・方針変更があった直後（自動）。

1. **`.studio/CHANGELOG.md` に1行追記**:
   `- YYYY-MM-DD HH:MM | <指示/変更の要約> | <変更ファイル/範囲> | <auth/DB/env/権限に触れたら ⚠️>`
2. **`.studio/spec.md` を最新化**（要件 / 受入基準 / やらないこと / 決定ログ）。要件や意図が変わっていれば**先に spec を直し**、その差分に実装を合わせる（living spec）。
