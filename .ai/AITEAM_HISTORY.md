# AITEAM_HISTORY.md
aiTeamプロジェクトの開発履歴・決定事項の記録

---

## 2026-03-25 — プロジェクト初日

### チーム構成（確定）
| メンバー | 役割 |
|---------|------|
| {TL} | 最終決定権者 |
| Claude Code CLI | 実装・コーディング担当 |
| Claude (claude.ai) | 設計・アーキテクチャ・検証担当 |
| Gemini | 監査・履歴管理担当（READ ONLY） |

---

### 作業サマリー

#### 0001 — 初期リポジトリ構成（baskhuu）
- GitHubリポジトリ作成、基本ファイル配置

#### 0002 — 全初期ファイルの仕様準拠修正（Claude）
- `.gitignore` を仕様通りに拡張
- `README.md` をチーム構成・セットアップ手順付きで更新
- `.github/copilot-instructions.md` にチーム役割を明記
- `.env.example` 作成

#### 0003–0005 — ログ同期・初期設定（Claude / baskhuu）
- `sync-logs.ps1` 初回実行・動作確認
- Claude Code CLI の Hooks 設定（Stop hook）
- `AITEAM_HISTORY.md` 初期記録（当時は後に削除）

#### 0007 — TL名を `{GitUser}` に統一（Claude）
- `CLAUDE.md` 内のハードコードされたTL名を `{GitUser}` に変更
- git config user.name を参照する方針に統一

#### 0008 — git push 必須ルール追記（Claude）
- `CLAUDE.md` に「git commit後は必ずgit pushを実行」ルールを追加

#### 0009–0011 — sync-logs.ps1 改善（Claude）
- コメント・出力メッセージを日本語化
- BOM（Byte Order Mark）問題を修正し文字化け解消
- コミットメッセージを `[Claude]` 固定に修正（Geminiが変更した箇所を差し戻し）

#### 0012–0016 — ログ同期 ×5回（baskhuu）
- 作業セッション中の定期ログ同期

#### 0017 — sync-logs.ps1 Gemini変更を破棄（Claude）
- Geminiが `sync-logs.ps1` を無断編集した問題を修正
- コミット担当者を `[Claude]` に固定

#### 0018 — GeminiのROLE明確化・承認ルール強化（Claude）
- `copilot-instructions.md` に以下を明記:
  - Gemini は READ ONLY（ファイル編集・コミット不可）
  - 全ファイル変更はTL承認が前提
  - `settings.json` 変更はTL承認必須

---

### 決定事項・ルール（確定）

1. **Gemini は READ ONLY** — ファイル編集・コミット・push は一切禁止
2. **全ファイル変更はTL承認前提**
3. **git commit後は必ずgit push**
4. **settings.json 変更はTL承認必須**
5. **GeminiとTLの決定事項はTLがClaude Code CLIに直接共有する**
6. **コミットメッセージ形式**: `[担当名] 内容`（例: `[Claude] sync-logs修正`）
7. **コミットの特定**: メンバー間・プログラム参照ともに **Gitハッシュ** を使用する
8. **AITEAM_HISTORY.md更新責任**: 重要な変更・決定時にClaudeが必ず更新してコミット

---

### 課題・TODO

- [x] `sync-logs.ps1` に `AITEAM_HISTORY.md` へのサマリー自動追記機能を追加（0020完了）
- [x] Geminiのチャットログの取り込み方法の検討 → `[GEMINI_DECISION]` 自動検知フローで解決（0042完了）

---

## 2026-03-26 — 連番管理・履歴整備

### 作業サマリー

#### 0019 — AITEAM_HISTORY.md 初期作成（Claude）
- 昨日の作業履歴・決定事項を記録、`.ai/` 配下に新規作成

#### 0020 — sync-logs.ps1 AITEAM_HISTORY自動追記機能追加（Claude）
- ログ同期のたびに当日セッションを自動追記するロジックを実装

#### 0022 — ルート直下の旧AITEAM_HISTORY.mdを削除（Claude）
- GeminiがルートのファイルをVSCode `@AITEAM_HISTORY.md` で読んでいた問題を解消
- 正しいパス: `.ai/AITEAM_HISTORY.md` に統一（→ `@.ai/AITEAM_HISTORY.md` で指定必須）

#### 0027〜0031 — 連番重複バグの修正（Claude）
- `git rev-list --count HEAD` 方式が手動コミットと競合して重複を起こすバグを修正
- 直前コミットのメッセージから連番を抽出する方式に変更

#### 0032〜0036 — VERSIONファイル導入（Claude）
- `.ai/VERSION`（1行目: バージョン、2行目: 最終連番）を新設
- git履歴に依存しない自己完結型カウンターに変更
- 新プロジェクト開始時・バージョンアップ時はVERSIONをリセットするだけでOK

#### 0040 — 重複防止の根本対策（Claude）
- `MAX(VERSIONの連番, git最終コミットの連番) + 1` を採用
- 手動コミット後にVERSIONが古くても重複しない構造に改善

---

### 決定事項・ルール（2026-03-26 追加）

9. **Geminiのファイル参照パス**: `@.ai/AITEAM_HISTORY.md`（ルート直下ではない）
10. **セッションログ管理**: `.ai/aiteam.db`（SQLite）に保存・gitignore対象
11. **ログ同期**: `npm run sync`（`sync-logs.js` → SQLite保存、gitコミットなし）
12. **TL表記**: ドキュメント内は `{TL}` / `{GitUser}` プレースホルダーを使用（固有名を書かない）
13. **Gemini決定事項の記録**: `npm run gemini-log -- --category <種別> --content <内容>` でSQLiteに記録
    - 種別: `approval`（承認）/ `architecture`（設計）/ `version`（バージョン）/ `rule`（ルール）
    - `approval` / `architecture` / `rule` は `AITEAM_HISTORY.md` にも自動追記

---

#### 0043 — ログのSQLite一元管理への移行（Claude）
- `sync-logs.js` をDB保存専用に変更（ファイル書き出し廃止）
  - `jsonl_content` / `summary_md` / `file_hash` カラムを sessions テーブルに追加
  - SHA256ハッシュによる重複取込み防止
- `migrate-logs.js` 新規作成（既存ファイルのDB移行・削除ツール）
- 既存ログ162ファイル（JSONL 81件 + MD 81件）をDBに移行後、削除
- `package.json` に `migrate-logs` スクリプト追加
- `aiteam.db` 1ファイルで全履歴を持ち運び可能になった

#### 0042 — Gemini決定事項の自動登録フロー確立（Claude）
- `CLAUDE.md` に `[GEMINI_DECISION]` ブロック検知・自動実行ルールを追加
- `copilot-instructions.md` にGemini向け出力フォーマットを定義
- TLは貼り付けるだけ、コマンド不要のフローが完成

#### 0041 — Gemini決定事項ログ機能の実装（Claude）
- `.ai/scripts/gemini-log.js` 新規作成
- `npm run gemini-log` コマンド追加（`package.json`）
- `gemini_decisions` テーブルを SQLite に追加（`sync-logs.js` の `initDb` にも反映）
- Gemini監査提案（カテゴリ管理・コミットハッシュリンク・AITEAM_HISTORY自動追記）を採用

---

> セッションログはSQLite（`.ai/aiteam.db`）で管理しています。