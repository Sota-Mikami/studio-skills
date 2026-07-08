---
description: 実装を本番に反映（個人プロジェクトの一連の流れ・P6 Ship モード）
---

> ドクトリン正本: `~/.claude/studio/DOCTRINE.md`（studio ループの規律。未読ならまず読む）

# /studio:ship — 本番反映（P6・Ship モード）

> **ループ内の位置**: P6（**個人 repo の出力**＝本番反映が一連の流れ）。
> **いつ選ぶ**: 共有でなく、本番デプロイ / 本番実装まで進めるのが自然な個人プロジェクト。チームの他者レビューは `/studio:share`。

1. **デプロイ規約を発見**（決め打ちしない）: そのエリアの CLAUDE.md のホスティング規約、repo の deploy スクリプト / CI / Vercel / Coolify 等。
2. 出す前に **`/studio:verify`（受入基準に根拠）＋ `/studio:precommit`（型 / lint / 動作）** を通す。
3. **本番反映**: プロジェクトの方式に従う（PR→merge / deploy コマンド / CI）。**commit / merge / deploy は人間の承認を挟む**（HITL）。
4. 反映後、**変えた点・ユーザーが確認すべき点**を要約し、`.studio/CHANGELOG.md` に記録。確定した結論は repo の spec / docs に反映する。
