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
- `.ai/scripts/sync-logs.js`: ログ同期・SQLite保存スクリプト（Node.js）
- `.ai/scripts/sync-logs.ps1`: Stop hookエントリポイント（`npm run sync` を呼ぶ）
- `.ai/AITEAM_HISTORY.md`: プロジェクト開発履歴（重要な変更・決定事項のみ）
- `.ai/aiteam.db`: セッションログDB（SQLite・gitignore対象）
- `package.json`: npm設定（better-sqlite3依存）
- `.gitignore`: 非公開ファイルの除外設定
- `LICENSE`: MITライセンス

## セットアップ
```bash
git clone https://github.com/baskhuu/aiTeam.git
cd aiTeam
npm install
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
