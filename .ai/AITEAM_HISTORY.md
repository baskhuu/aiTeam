# AITEAM_HISTORY.md
aiTeamプロジェクトの開発履歴・決定事項の記録

---

## 2026-03-25 — プロジェクト初日

### チーム構成（確定）
| メンバー | 役割 |
|---------|------|
| baskhuu (TL) | 最終決定権者 |
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
2. **全ファイル変更はTL（baskhuu）承認前提**
3. **git commit後は必ずgit push**
4. **settings.json 変更はTL承認必須**
5. **GeminiとTLの決定事項はTLがClaude Code CLIに直接共有する**
6. **コミットメッセージ形式**: `v[ver] - [4桁連番]: [[担当名]] [内容]`

---

### 課題・TODO

- [x] `sync-logs.ps1` に `AITEAM_HISTORY.md` へのサマリー自動追記機能を追加（0020完了）
- [ ] Geminiのチャットログの取り込み方法の検討（現状: TL経由で手動共有）

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

7. **Geminiのファイル参照パス**: `@.ai/AITEAM_HISTORY.md`（ルート直下ではない）
8. **バージョンアップ**: TLがClaudeに指示 → `.ai/VERSION` の1行目を変更・2行目を `0000` にリセット
9. **新プロジェクト開始時**: `.ai/VERSION` を `新バージョン\n0000` にリセット
10. **連番採番ロジック**: `MAX(VERSIONの連番, git最終コミットの連番) + 1`

---

## 2026-03-26 — セッションログ

- `20260326_092611` [サマリー](.ai/logs/claude_cli/20260326_092611_summary.md) — 昨日の作業を報告して
- `20260326_093014` [サマリー](.ai/logs/claude_cli/20260326_093014_summary.md) — 昨日の作業を報告して
- `20260326_093212` [サマリー](.ai/logs/claude_cli/20260326_093212_summary.md) — 昨日の作業を報告して
- `20260326_093428` [サマリー](.ai/logs/claude_cli/20260326_093428_summary.md) — 昨日の作業を報告して
- `20260326_094218` [サマリー](.ai/logs/claude_cli/20260326_094218_summary.md) — 昨日の作業を報告して
- `20260326_094606` [サマリー](.ai/logs/claude_cli/20260326_094606_summary.md) — 昨日の作業を報告して
- `20260326_094905` [サマリー](.ai/logs/claude_cli/20260326_094905_summary.md) — 昨日の作業を報告して
- `20260326_095032` [サマリー](.ai/logs/claude_cli/20260326_095032_summary.md) — 昨日の作業を報告して
- `20260326_095251` [サマリー](.ai/logs/claude_cli/20260326_095251_summary.md) — 昨日の作業を報告して
- `20260326_095708` [サマリー](.ai/logs/claude_cli/20260326_095708_summary.md) — 昨日の作業を報告して
- `20260326_100109` [サマリー](.ai/logs/claude_cli/20260326_100109_summary.md) — 昨日の作業を報告して
- `20260326_100535` [サマリー](.ai/logs/claude_cli/20260326_100535_summary.md) — 昨日の作業を報告して
- `20260326_101102` [サマリー](.ai/logs/claude_cli/20260326_101102_summary.md) — 昨日の作業を報告して
- `20260326_101549` [サマリー](.ai/logs/claude_cli/20260326_101549_summary.md) — 昨日の作業を報告して
- `20260326_101851` [サマリー](.ai/logs/claude_cli/20260326_101851_summary.md) — 昨日の作業を報告して
- `20260326_102709` [サマリー](.ai/logs/claude_cli/20260326_102709_summary.md) — 昨日の作業を報告して
- `20260326_103138` [サマリー](.ai/logs/claude_cli/20260326_103138_summary.md) — 昨日の作業を報告して
- `20260326_103632` [サマリー](.ai/logs/claude_cli/20260326_103632_summary.md) — 昨日の作業を報告して
- `20260326_104338` [サマリー](.ai/logs/claude_cli/20260326_104338_summary.md) — 昨日の作業を報告して
- `20260326_105003` [サマリー](.ai/logs/claude_cli/20260326_105003_summary.md) — 昨日の作業を報告して
- `20260326_110028` [サマリー](.ai/logs/claude_cli/20260326_110028_summary.md) — 昨日の作業を報告して
- `20260326_110240` [サマリー](.ai/logs/claude_cli/20260326_110240_summary.md) — 昨日の作業を報告して
- `20260326_110940` [サマリー](.ai/logs/claude_cli/20260326_110940_summary.md) — 昨日の作業を報告して
- `20260326_111130` [サマリー](.ai/logs/claude_cli/20260326_111130_summary.md) — 昨日の作業を報告して
- `20260326_111759` [サマリー](.ai/logs/claude_cli/20260326_111759_summary.md) — 昨日の作業を報告して
- `20260326_113115` [サマリー](.ai/logs/claude_cli/20260326_113115_summary.md) — 昨日の作業を報告して