# Copilot Instructions for aiTeam

## Project snapshot
- Current workspace contains only `.ai/` and `.claude/` directories. No source code files are present in root yet.
- If relevant code is in another workspace or branch, adjust paths accordingly.

## Big-picture focus
- Explore where runtime and config live (e.g. common dirs like `src/`, `packages/`, `services/` if added later).
- Identify the service boundary pattern in this repo once code appears (likely monorepo with agent workflows in separate folders).

## Search patterns
- Use glob search for docs and pipeline files:
  - `**/.github/workflows/*.yml`
  - `**/README.md`
  - `**/package.json`, `**/pyproject.toml`
  - `**/{.github/copilot-instructions.md,AGENT.md,AGENTS.md,CLAUDE.md}`

## Development workflow conventions
- Prioritize discovered scripts in `package.json` / `pyproject` / root-level `Makefile`.
- If no explicit scripts, ask maintainers for standard commands.

## Integration points to capture
- Candidate places: `api/`, `backend/`, `frontend/`, `infra/`, `services/` directories.
- Watch for cross-component patterns (HTTP clients, message queues, shared libs under `libs/`).

## Agent behavior guidelines
- If file exists, merge with existing `.github/copilot-instructions.md` content preserving non-stale instructions.
- Use concise suggestions with exact filenames once available.

## On first code appearance
- Add concrete patterns:
  - e.g. `in src/api/ handlers accept (request, context)`
  - `in services/` prefer `serviceName -> serviceNameClient` for calls
  - `in tests/` use `pytest -q tests/` or `npm test -- --runInBand` etc.

## Request feedback loop
- After creating patch, ask maintainers:
  - Is there a preferred repo structure we should document?
  - What CI/CD steps are missing in the instructions?

## aiTeam プロジェクト開発規約
- チーム構成と役割分担（厳守）
  - {GitUser} (TL): 最終決定権者
  - Claude Code CLI: ファイル編集・コミット・push を実行する唯一の担当
  - Claude (claude.ai): 設計・アーキテクチャ・検証担当（提案のみ、編集不可）
  - Gemini: 監査・履歴管理担当（参照のみ、編集不可）

- Geminiの行動ルール（厳守）
  - リポジトリのファイルはREAD ONLYで参照すること
  - 提案・意見はチャットのみで行い、ファイルの直接編集は禁止
  - ファイル編集が必要な場合はチャットで提案し、TL承認後にClaude Code CLIが実施する

- コミットメッセージ規則（厳守）
  - `v[バージョン] - [4桁連番]: [[担当名]] [内容]`
  - 担当名は固定: `[Claude]`（Claude Code CLI自動）/ `[{GitUser}]`（TL手動）/ `[Gemini]`（将来対応）
  - 例: `v0.0.1 - 0001: [Claude] sync-logs.ps1修正`

- 運用ルール
  - ログは `.ai/logs/` に保存する
  - プロジェクト履歴は `AITEAM_HISTORY.md` に蓄積する
  - 構造化データは `.ai/aiTeam.db` (SQLite) で管理する
  - 公開リポジトリのため、`.ai/logs/` や `.db` ファイルは Git に含めない (`.gitignore` を遵守)

- 承認ルール（厳守）
  - スクリプト・設定・ドキュメント問わず、全ファイルの変更は実行前に必ず {GitUser} (TL) に確認すること
  - TLの承認なしにいかなるファイルも変更・コミット・pushしないこと
