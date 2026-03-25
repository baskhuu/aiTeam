# AITEAM_HISTORY

## 2026-03-25 初期設定
- プロジェクトルールを `README` ではなく `.github/copilot-instructions.md` に統合
- チーム構成、コミットメッセージ規則、運用ルールを明文化
- `.ai/scripts/sync-logs.ps1` を追加（最新 JSONL をコピーし git push するスクリプト）
- `.gitignore` に `.ai/logs/` と `.ai/*.db` を追加
- `AITEAM_HISTORY.md` と `LICENSE` を初期作成

## 2026-03-25 初期ファイル仕様準拠修正・同期基盤整備

### 完了したこと
- `.gitignore` を仕様通りに拡張（OS/エディタ/Python/Node.js/Claude Code CLI/機密情報ルール追加）
- `sync-logs.ps1` を全面修正
  - ソース: `~/.claude/projects/` から最新JSONLを取得
  - コピー先: `.ai/logs/claude_cli/` に保存
  - Gemini用Markdownサマリーを自動生成
  - PowerShell UTF-8 BOM対応（Windows SJIS誤読み防止）
- `README.md` 軽微修正（目的行の改行除去）
- `.env.example` 新規作成
- `CLAUDE.md` をGit追跡対象に追加
- `.claude/settings.json` 新規作成 → StopイベントでHooks自動実行設定
- `sync-logs.ps1` の動作確認完了（JSONL取得・Markdown生成・git push成功）

### 未完了
- `package.json` の作成
- CI/CDワークフロー（`.github/workflows/`）
- SQLite管理（`.ai/aiTeam.db`）の設計・実装

### 次のステップ
- Hooksによる自動同期の実運用確認（セッション終了時に自動実行されるか）
- `package.json` 作成（npm scripts経由でsync-logsを呼び出せるように）

## 今後の予定
- 実際のソースコード配置を確認し、`src/` / `services/` などのワークフローを追記
- CIワークフローの実装と `package.json` / `pyproject.toml` ベースのコマンドを記載
