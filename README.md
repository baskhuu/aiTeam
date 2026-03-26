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

## 手動コミット時のルール

手動で `git commit` する場合は、**コミット前に以下を必ず実施**してください。

### 1. 次の連番を確認する

`.ai/VERSION` の **2行目** が最後に使った連番です。

```
# .ai/VERSION
0.0.1   ← 1行目: バージョン
0043    ← 2行目: 最後に使った連番
```

次のコミットには `0044` を使用し、コミット後に2行目を `0044` に更新します。

### 2. VERSION ファイルを更新する

```powershell
# .ai/VERSION の2行目を使用した連番に書き換える
# 例: 0044 を使ったなら
(Get-Content .ai/VERSION) -replace '^(\d+)$','0044' | Set-Content .ai/VERSION
```

または直接 `.ai/VERSION` をエディタで編集（2行目の数字を変更）。

### 3. AITEAM_HISTORY.md を更新する（重要な変更の場合）

`.ai/AITEAM_HISTORY.md` に作業サマリーを追記してから一緒にコミットしてください。

---

**まとめ: 手動コミット時のチェックリスト**
- [ ] `.ai/VERSION` 2行目で次の連番を確認
- [ ] コミットメッセージに正しい連番を使用
- [ ] `.ai/VERSION` 2行目を使用した連番に更新してステージング
- [ ] 重要な変更なら `.ai/AITEAM_HISTORY.md` も更新してステージング

## ライセンス
MIT
