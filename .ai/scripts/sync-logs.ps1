# sync-logs.ps1
# 役割: ~/.claude/projects/ の最新JSONLを .ai/logs/claude_cli/ にコピーし、
#       Gemini用Markdownサマリーを生成して git commit & push する

param(
    [string]$Version = "0.0.1"
)

$ErrorActionPreference = "Stop"
# コンソール・パイプの文字コードをUTF-8に統一（Windows文字化け防止）
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# スクリプトの2階層上がリポジトリルート（.ai/scripts/ -> .ai/ -> リポジトリルート）
$repoRoot = $PSScriptRoot | Split-Path | Split-Path

# ── ステップ1: ~/.claude/projects/ から最新JSONLを取得 ──────────────
$claudeProjectsDir = Join-Path $HOME ".claude\projects"
if (-not (Test-Path $claudeProjectsDir)) {
    Write-Error "Claudeプロジェクトディレクトリが見つかりません: $claudeProjectsDir"
    exit 1
}

$jsonl = Get-ChildItem -Path $claudeProjectsDir -Filter "*.jsonl" -Recurse |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $jsonl) {
    Write-Error "JSONLファイルが見つかりません: $claudeProjectsDir"
    exit 1
}

Write-Output "取得元JSONL: $($jsonl.FullName)"

# ── ステップ2: .ai/logs/claude_cli/ にコピー ──────────────────
$destDir = Join-Path $repoRoot ".ai\logs\claude_cli"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Output "ディレクトリ作成: $destDir"
}

$dateStr = Get-Date -Format "yyyyMMdd_HHmmss"
$destJsonl = Join-Path $destDir "$($dateStr)_$($jsonl.Name)"
Copy-Item -Path $jsonl.FullName -Destination $destJsonl -Force
Write-Output "コピー完了: $destJsonl"

# ── ステップ3: Gemini用Markdownサマリーを生成 ────────────────
$mdPath = Join-Path $destDir "$($dateStr)_summary.md"
$lines = Get-Content -Path $jsonl.FullName -Encoding UTF8 -ErrorAction SilentlyContinue

$mdLines = [System.Collections.Generic.List[string]]::new()
$mdLines.Add("# Claude CLI セッションログ - $dateStr")
$mdLines.Add("")
$mdLines.Add("## メタ情報")
$mdLines.Add("- 取得元: $($jsonl.FullName)")
$mdLines.Add("- 生成日時: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$mdLines.Add("- 行数: $($lines.Count)")
$mdLines.Add("")
$mdLines.Add("## セッション内容")
$mdLines.Add("")

foreach ($line in $lines) {
    try {
        $obj = $line | ConvertFrom-Json -ErrorAction Stop
        # user / assistant 以外のメタエントリはスキップ
        if ($obj.type -notin @("user", "assistant")) { continue }
        $msg = $obj.message
        if (-not $msg) { continue }
        $role = if ($msg.role) { $msg.role } else { $obj.type }
        $text = ""
        if ($msg.content -is [string]) {
            $text = $msg.content
        } elseif ($msg.content -is [array]) {
            # 複数コンテンツブロックのうち type=text のものだけ結合
            $text = ($msg.content | Where-Object { $_.type -eq "text" } | ForEach-Object { $_.text }) -join ""
        }
        if ($text) {
            $mdLines.Add("### [$role]")
            $mdLines.Add($text)
            $mdLines.Add("")
        }
    } catch {
        # JSONパース失敗行はスキップ
    }
}

# BOMなしUTF-8で書き出し（Out-File はBOM付きになるため WriteAllLines を使用）
[System.IO.File]::WriteAllLines($mdPath, $mdLines, [System.Text.Encoding]::UTF8)
Write-Output "Gemini用Markdown生成: $mdPath"

# ── ステップ3.5: AITEAM_HISTORY.md に要約追記 ───────────────
$historyPath = Join-Path $repoRoot "AITEAM_HISTORY.md"
if (-not (Test-Path $historyPath)) {
    New-Item -ItemType File -Path $historyPath -Force | Out-Null
}

# セッション内容の要約（最初のuser/assistant発話を取得）
$summaryBlocks = $mdLines | Select-String -Pattern '^### \[' | Select-Object -First 2
$summarySnippet = if ($summaryBlocks) { ($summaryBlocks | ForEach-Object { $_.Line }) -join ' | ' } else { '内容なし' }

$historyEntry = @(
    "## セッション $dateStr",
    "- JSONL: $($jsonl.Name)",
    "- 生成日時: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')",
    "- 行数: $($lines.Count)",
    "- サマリー: $summarySnippet",
    ""
)
Add-Content -Path $historyPath -Value $historyEntry -Encoding UTF8
Write-Output "AITEAM_HISTORYに追記: $historyPath"

# ── ステップ4: 差分があればgit commit & push ────────────────
Set-Location $repoRoot

# ?? (未追跡) を除いた変更行のみ取得
$staged = git status --porcelain 2>$null | Where-Object { $_ -notmatch "^\?\?" }
if ($staged) {
    $commitCount = (git rev-list --count HEAD 2>$null)
    if (-not $commitCount) { $commitCount = 0 }
    $serial = "{0:D4}" -f ([int]$commitCount + 1)
    $gitUser = git config user.name
    $commitMsg = "v$Version - $serial`: [$gitUser] ログ同期 $dateStr"

    git add -u
    git commit -m $commitMsg
    git push
    Write-Output "Git push完了: $commitMsg"
} else {
    Write-Output "Git: コミット対象なし（ログはgitignore対象のためローカル保存のみ）"
}

Write-Output ""
Write-Output "=== 同期完了 ==="
Write-Output "JSONL      : $destJsonl"
Write-Output "Markdown   : $mdPath"
