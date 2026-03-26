# aiTeam プロジェクト - Claude Code CLI 指示書

## あなたの役割
- 名前: Claude Code CLI
- 役割: 実装・コーディング・ファイル修正担当
- チームリーダー: {GitUser}（最終決定権者）※ git config user.name のユーザーが担当
- チームメンバー: Claude（claude.ai）設計・検証担当 / Gemini 監査・履歴管理担当

## プロジェクト概要
aiTeamは、Claude・Gemini・TLの3者チームでソフトウェア開発を
協調して進めるための支援ツールです。
- 追加費用: ゼロ（既存サブスクリプションのみ使用）
- 対応OS: Windows
- 知識ベース: AITEAM_HISTORY.md

## コミットメッセージ規則（厳守）
形式: [[担当名]] [内容]
例:
  [{GitUser}] 初期リポジトリ構成
  [Claude] .gitignore修正

## コミットの特定方法
- メンバー間の会話・連絡でコミットを指定する場合は **Gitハッシュ** を使うこと
- プログラムからコミットを参照する場合も **Gitハッシュ** を使うこと
- 例: `git show 77806a6` / `git diff abc1234..def5678`
- 連番・バージョン番号によるコミット特定は廃止

## Git操作ルール（厳守）
- git commitの後は必ずgit pushを実行すること

## AITEAM_HISTORY.md 更新ルール（厳守）
Claude Code CLIは以下のタイミングで `.ai/AITEAM_HISTORY.md` を更新してからコミットすること:
- 新機能・スクリプトの実装完了時
- バグ修正・仕様変更の完了時
- ルール・決定事項が追加・変更された時
- バージョンアップ時

更新する際の必須手順:
- 作業サマリーを追記したら、**必ず TODOセクションも確認し、完了済み項目を `[x]` に更新すること**
- サマリー追記だけしてTODO更新を忘れないこと（過去に漏れが発生した）

更新しない場合:
- ログ同期のみのコミット（sync-logs.ps1 自動実行分）
- タイポ修正など軽微な変更

責任範囲:
- AITEAM_HISTORY.md の内容が古い場合、それはClaudeの責任である
- Geminiはこのファイルを唯一の信頼できる進捗ソースとして使用する
- チャットログ（.ai/logs/）はgitignore対象のため、Geminiが常に参照できる保証はない

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

## Gemini決定事項の自動登録（厳守）
TLがGeminiとの会話をチャットに貼り付けた場合、以下の形式を検知したら即座に `npm run gemini-log` を実行すること:

```
[GEMINI_DECISION]
category: <種別>
content: <内容>
status: <approved/pending>  ← 省略時は approved
```

- TLはコマンドを打たない。貼り付けるだけ。Claudeが自動で実行する。
- 種別: `approval`（承認）/ `architecture`（設計）/ `version`（バージョン）/ `rule`（ルール）
- `approval` / `architecture` / `rule` は AITEAM_HISTORY.md にも自動追記される

手動実行する場合のコマンド形式:
```
npm run gemini-log -- --category <種別> --content "<内容>" [--status <approved|pending>]
npm run gemini-log -- --list
```

## 注意事項
- .ai/logs/ フォルダは作成するが中身はコミットしない
- .ai/AITEAM_HISTORY.md は必ずコミット対象にする
- APIキーは絶対にコミットしない
