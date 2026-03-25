# AITEAM_HISTORY

## 2026-03-25 初期設定
- プロジェクトルールを `README` ではなく `.github/copilot-instructions.md` に統合
- チーム構成、コミットメッセージ規則、運用ルールを明文化
- `.ai/scripts/sync-logs.ps1` を追加（最新 JSONL をコピーし git push するスクリプト）
- `.gitignore` に `.ai/logs/` と `.ai/*.db` を追加
- `AITEAM_HISTORY.md` と `LICENSE` を初期作成

## 今後の予定
- 実際のソースコード配置を確認し、`src/` / `services/` などのワークフローを追記
- CIワークフローの実装と `package.json` / `pyproject.toml` ベースのコマンドを記載
