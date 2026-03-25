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

## 確定ルール（2026-03-25）
- TL名は `git config user.name` を使用する（固有名詞をコードに直接書かない）
- コミットメッセージのTL名、スクリプト内のユーザー名は全て `git config user.name` で動的取得する
- チーム構成ドキュメントでは `{GitUser}` というプレースホルダーで表記する

## 本日の教訓（2026-03-25）
- `sync-logs.ps1` の日本語化でBOM問題が再発（PowerShellはBOM付きUTF-8が必要）
- GeminiへのログはHooksが正常動作して初めて情報同期が完成する
- `settings.json` はTL承認なしに変更禁止ルールを追加済み

## 今後の予定
- 実際のソースコード配置を確認し、`src/` / `services/` などのワークフローを追記
- CIワークフローの実装と `package.json` / `pyproject.toml` ベースのコマンドを記載
## セッション 20260325_175723
- JSONL: 7e32eb67-c2b4-49ca-9294-998cb7099a54.jsonl
- 生成日時: 2026-03-25 17:57:23
- 行数: 216
- サマリー: ### [user] | ### [assistant]

## セッション 20260325_180038
- JSONL: 7e32eb67-c2b4-49ca-9294-998cb7099a54.jsonl
- 生成日時: 2026-03-25 18:00:38
- 行数: 222
- サマリー: ### [user] | ### [assistant]

## セッション 20260325_180309
- JSONL: 7e32eb67-c2b4-49ca-9294-998cb7099a54.jsonl
- 生成日時: 2026-03-25 18:03:09
- 行数: 229
- サマリー: ### [user] | ### [assistant]

## セッション 20260325_180327
- JSONL: 7e32eb67-c2b4-49ca-9294-998cb7099a54.jsonl
- 生成日時: 2026-03-25 18:03:27
- 行数: 236
- サマリー: ### [user] | ### [assistant]

## セッション 20260325_180824
- JSONL: 7e32eb67-c2b4-49ca-9294-998cb7099a54.jsonl
- 生成日時: 2026-03-25 18:08:24
- 行数: 244
- サマリー: ### [user] | ### [assistant]

## セッション 20260325_181025
- JSONL: 7e32eb67-c2b4-49ca-9294-998cb7099a54.jsonl
- 生成日時: 2026-03-25 18:10:26
- 行数: 253
- サマリー: ### [user] | ### [assistant]

