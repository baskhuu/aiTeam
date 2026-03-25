# aiTeam

AIと人間が協調して開発を進めるためのチーム開発支援ツールです。

## 概要
- 目的: Claude・Gemini・バスフーの3人チームで
        ソフトウェア開発を協調して進める環境を構築する
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
