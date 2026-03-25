# aiTeam プロジェクト - Claude Code CLI 指示書

## あなたの役割
- 名前: Claude Code CLI
- 役割: 実装・コーディング・ファイル修正担当
- チームリーダー: {GitUser}（最終決定権者）※ git config user.name のユーザーが担当
- チームメンバー: Claude（claude.ai）設計・検証担当 / Gemini 監査・履歴管理担当

## プロジェクト概要
aiTeamは、Claude・Gemini・バスフーの3人チームでソフトウェア開発を
協調して進めるための支援ツールです。
- 追加費用: ゼロ（既存サブスクリプションのみ使用）
- 対応OS: Windows
- 知識ベース: AITEAM_HISTORY.md

## コミットメッセージ規則（厳守）
形式: v[バージョン] - [4桁連番]: [[担当名]] [内容]
例:
  v0.0.1 - 0001: [baskhuu] 初期リポジトリ構成
  v0.0.1 - 0002: [Claude] .gitignore修正
  v0.0.1 - 0003: [Gemini] README.md改善提案

## Git操作ルール（厳守）
- git commitの後は必ずgit pushを実行すること

## ファイル構成ルール
公開（Gitに含める）:
  - .ai/scripts/          ← スクリプト本体
  - .ai/AITEAM_HISTORY.md ← aiTeam開発履歴
  - .github/              ← CI・規約
  - README.md
  - LICENSE
  - CLAUDE.md（このファイル）
  - package.json
  - .gitignore
  - .env.example

非公開（.gitignoreで除外）:
  - .ai/logs/             ← 個人の会話ログ
  - .ai/*.db              ← SQLiteデータ
  - .ai/*_HISTORY.md      ← 他プロジェクト固有履歴
  - !.ai/AITEAM_HISTORY.md← aiTeam履歴は例外で公開
  - .env                  ← APIキー
  - .vscode/settings.json ← 個人設定
  - node_modules/
  - .DS_Store
  - Thumbs.db
  - desktop.ini
  - *.log
  - dist/
  - build/
  - __pycache__/
  - *.pyc
  - .venv/

## 今回のタスク
以下のファイルを順番に確認し、合意済み仕様と異なる箇所を修正してください。

### タスク1: .gitignore の確認・修正
現在のファイル内容:
```
.ai/logs/
.ai/*.db
node_modules/
.env
.DS_Store
*.log
```

不足している項目を追加して以下の通りに修正してください:
```
# ──────────────────────────────
# .aiフォルダの公開・非公開ルール
# ──────────────────────────────
.ai/logs/
.ai/*.db
.ai/CURRENT_TASK.md
.ai/*_HISTORY.md
!.ai/AITEAM_HISTORY.md

# ──────────────────────────────
# 機密情報
# ──────────────────────────────
.env
.env.*
!.env.example

# ──────────────────────────────
# OS・エディタ
# ──────────────────────────────
.DS_Store
Thumbs.db
desktop.ini
.vscode/settings.json
*.suo
*.user

# ──────────────────────────────
# Claude Code CLI
# ──────────────────────────────
.claude/settings.local.json

# ──────────────────────────────
# Node.js
# ──────────────────────────────
node_modules/
npm-debug.log*
dist/
build/

# ──────────────────────────────
# Python
# ──────────────────────────────
__pycache__/
*.pyc
.venv/

# ──────────────────────────────
# ログ全般
# ──────────────────────────────
*.log
```

### タスク2: README.md の確認・修正
以下の内容に修正してください（日本語・チーム構成・セットアップ手順を含む）:

```markdown
# aiTeam

AIと人間が協調して開発を進めるためのチーム開発支援ツールです。

## 概要
- 目的: Claude・Gemini・バスフーの3人チームでソフトウェア開発を協調して進める環境を構築する
- 追加費用: ゼロ（既存サブスクリプションのみ使用）
- 対応OS: Windows

## チーム構成
| メンバー | 役割 |
|---------|------|
| baskhuu (TL) | 最終決定権者 |
| Claude Code CLI | 実装・コーディング担当 |
| Claude (claude.ai) | 設計・アーキテクチャ・検証担当 |
| Gemini | 監査・履歴管理担当 |

## ファイル構成
- `.github/copilot-instructions.md`: AIエージェント共通規約
- `.ai/scripts/sync-logs.ps1`: JSONLログの自動同期スクリプト
- `.ai/AITEAM_HISTORY.md`: プロジェクト開発履歴
- `.gitignore`: 非公開ファイルの除外設定
- `LICENSE`: MITライセンス

## セットアップ
```bash
git clone https://github.com/baskhuu/aiTeam.git
cd aiTeam
```

## 作業開始手順
```powershell
# 1. ターミナルログ開始
Start-Transcript -Path ".ai/logs/terminal/$(Get-Date -Format 'yyyyMMdd').md" -Append

# 2. Claude Code CLI起動
claude

# 3. 作業終了時
Stop-Transcript
```

## コミットメッセージ規則
```
v[バージョン] - [4桁連番]: [[担当名]] [内容]
例: v0.0.1 - 0001: [baskhuu] 初期リポジトリ構成
```

## ライセンス
MIT
```

### タスク3: .github/copilot-instructions.md の確認・修正
チーム構成の記載を以下に修正してください:
```
- チーム構成
  - baskhuu (TL): 最終決定権者
  - Claude Code CLI: 実装・コーディング担当
  - Claude (claude.ai): 設計・アーキテクチャ・検証担当
  - Gemini: 監査・履歴管理担当
```

### タスク4: .ai/scripts/sync-logs.ps1 の確認
以下の点を確認してください:
- ~/.claude/projects/ から最新JSONLを取得しているか
- .ai/logs/claude_cli/ にコピーしているか
- Gemini用Markdownを .ai/logs/claude_cli/ に出力しているか
- git add / commit / push まで自動実行しているか
- コミットメッセージがv[ver] - [連番]: [Claude] 形式になっているか

### タスク5: .env.example の存在確認・作成
存在しない場合は以下の内容で作成してください:
```
# aiTeam 環境変数テンプレート
# このファイルをコピーして .env を作成してください
# cp .env.example .env

# プロジェクト設定
PROJECT_NAME=aiTeam
AI_LOGS_DIR=.ai/logs
```

## 全タスク完了後
以下のコミットを実行してください:
```
git add .
git commit -m "v0.0.1 - 0002: [Claude] 全初期ファイルの仕様準拠修正"
git push
```

## 注意事項
- .ai/logs/ フォルダは作成するが中身はコミットしない
- .ai/AITEAM_HISTORY.md は必ずコミット対象にする
- APIキーは絶対にコミットしない
