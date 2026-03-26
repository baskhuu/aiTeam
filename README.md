# aiTeam

AIと人間が協調して開発を進めるためのチーム開発支援ツールです。

## 概要
- 目的: Claude・Gemini・{GitUser}の3人チームでソフトウェア開発を協調して進める環境を構築する
- 追加費用: ゼロ（既存サブスクリプションのみ使用）
- 対応OS: Windows

## チーム構成
| メンバー | 役割 |
|---------|------|
| {GitUser} (あなた) | 最終決定権者 ※ `git config user.name` の値 |
| Claude Code CLI | 実装・コーディング担当 |
| Claude (claude.ai) | 設計・アーキテクチャ・検証担当 |
| Gemini | 監査・履歴管理担当 |

## ファイル構成
- `.github/copilot-instructions.md`: AIエージェント共通規約
- `.ai/scripts/sync-logs.js`: ログ同期・SQLite保存スクリプト（Stop hook で自動実行）
- `.ai/scripts/gemini-log.js`: Gemini決定事項をSQLiteに記録するスクリプト
- `.ai/scripts/setup-project.js`: 他プロジェクトへの導入セットアップCLI
- `.ai/AITEAM_HISTORY.md`: プロジェクト開発履歴（重要な変更・決定事項のみ）
- `.ai/aiteam.db`: セッションログDB（SQLite・gitignore対象）
- `package.json`: npm設定（better-sqlite3依存）
- `.gitignore`: 非公開ファイルの除外設定
- `LICENSE`: MITライセンス

## 既存プロジェクトへの導入

導入先プロジェクトのルートで実行するだけです：

```bash
npx github:baskhuu/aiTeam
npm install
```

以下が自動でセットアップされます：
- `CLAUDE.md` / スクリプト群 / `copilot-instructions.md` のコピー
- `package.json` に `sync` / `gemini-log` / `migrate-logs` スクリプト追加
- `.gitignore` に aiTeam 除外ルール追記
- `.ai/logs/` ディレクトリ作成

## セットアップ後の設定

### 1. CLAUDE.md を編集
プロジェクト名・概要を実態に合わせて書き換えてください。

### 2. Claude Code の Stop hook を設定
Claude Code CLI を起動し、セッション終了時に自動でログ同期されるよう設定します：

```
/settings
```

Stop hook に以下を追加：
```
node .ai/scripts/sync-logs.js
```

### 3. 作業開始
```bash
claude
```

セッション終了時に自動でログが SQLite に保存されます。

## コミットメッセージ規則
```
[担当名] 内容
例: [{GitUser}] 初期リポジトリ構成
    [Claude] .gitignore修正
```

## 手動コミット時のルール

**チェックリスト**
- [ ] コミットメッセージは `[担当名] 内容` 形式
- [ ] 重要な変更なら `.ai/AITEAM_HISTORY.md` も更新してステージング

## ライセンス
MIT
