# sync-logs.ps1
# Source: ~/.claude/projects/ -> .ai/logs/claude_cli/ copy + Gemini Markdown generation

param(
    [string]$Version = "0.0.1"
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = $PSScriptRoot | Split-Path | Split-Path

# Step 1: Get latest JSONL from ~/.claude/projects/
$claudeProjectsDir = Join-Path $HOME ".claude\projects"
if (-not (Test-Path $claudeProjectsDir)) {
    Write-Error "Claude projects dir not found: $claudeProjectsDir"
    exit 1
}

$jsonl = Get-ChildItem -Path $claudeProjectsDir -Filter "*.jsonl" -Recurse |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $jsonl) {
    Write-Error "No JSONL found in: $claudeProjectsDir"
    exit 1
}

Write-Output "Source JSONL: $($jsonl.FullName)"

# Step 2: Copy to .ai/logs/claude_cli/
$destDir = Join-Path $repoRoot ".ai\logs\claude_cli"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Output "Created: $destDir"
}

$dateStr = Get-Date -Format "yyyyMMdd_HHmmss"
$destJsonl = Join-Path $destDir "$($dateStr)_$($jsonl.Name)"
Copy-Item -Path $jsonl.FullName -Destination $destJsonl -Force
Write-Output "Copied: $destJsonl"

# Step 3: Generate Gemini Markdown summary
$mdPath = Join-Path $destDir "$($dateStr)_summary.md"
$lines = Get-Content -Path $jsonl.FullName -Encoding UTF8 -ErrorAction SilentlyContinue

$mdLines = [System.Collections.Generic.List[string]]::new()
$mdLines.Add("# Claude CLI Session Log - $dateStr")
$mdLines.Add("")
$mdLines.Add("## Metadata")
$mdLines.Add("- Source: $($jsonl.FullName)")
$mdLines.Add("- Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')")
$mdLines.Add("- Lines: $($lines.Count)")
$mdLines.Add("")
$mdLines.Add("## Session Content")
$mdLines.Add("")

foreach ($line in $lines) {
    try {
        $obj = $line | ConvertFrom-Json -ErrorAction Stop
        # Skip non-conversation entries
        if ($obj.type -notin @("user", "assistant")) { continue }
        $msg = $obj.message
        if (-not $msg) { continue }
        $role = if ($msg.role) { $msg.role } else { $obj.type }
        $text = ""
        if ($msg.content -is [string]) {
            $text = $msg.content
        } elseif ($msg.content -is [array]) {
            $text = ($msg.content | Where-Object { $_.type -eq "text" } | ForEach-Object { $_.text }) -join ""
        }
        if ($text) {
            $mdLines.Add("### [$role]")
            $mdLines.Add($text)
            $mdLines.Add("")
        }
    } catch {
        # Skip unparseable lines
    }
}

[System.IO.File]::WriteAllLines($mdPath, $mdLines, [System.Text.Encoding]::UTF8)
Write-Output "Gemini Markdown: $mdPath"

# Step 4: Git commit if there are tracked changes (logs are gitignored - local only)
Set-Location $repoRoot

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
    Write-Output "Git push done: $commitMsg"
} else {
    Write-Output "Git: nothing to commit (logs are gitignored - saved locally only)"
}

Write-Output ""
Write-Output "=== Sync complete ==="
Write-Output "JSONL    : $destJsonl"
Write-Output "Markdown : $mdPath"
