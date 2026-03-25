# sync-logs.ps1
# ~/.claude/projects/ の最新 JSONL を .ai/logs/claude_cli/ にコピーし、
# Gemini用Markdownを生成して Git コミット＆プッシュする

param(
    [string]$Version = "0.0.1"
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot | Split-Path | Split-Path

# ── 1. ソース: ~/.claude/projects/ から最新JSONLを取得 ──────────────────
$claudeProjectsDir = Join-Path $HOME ".claude\projects"
if (-not (Test-Path $claudeProjectsDir)) {
    Write-Error "Claude projects ディレクトリが存在しません: $claudeProjectsDir"
    exit 1
}

$jsonl = Get-ChildItem -Path $claudeProjectsDir -Filter "*.jsonl" -Recurse |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

if (-not $jsonl) {
    Write-Error "JSONL ファイルが見つかりません: $claudeProjectsDir"
    exit 1
}

Write-Output "ソースJSONL: $($jsonl.FullName)"

# ── 2. コピー先: .ai/logs/claude_cli/ ─────────────────────────────────
$destDir = Join-Path $repoRoot ".ai\logs\claude_cli"
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Write-Output "作成: $destDir"
}

$dateStr = Get-Date -Format "yyyyMMdd_HHmmss"
$destJsonl = Join-Path $destDir "$($dateStr)_$($jsonl.Name)"
Copy-Item -Path $jsonl.FullName -Destination $destJsonl -Force
Write-Output "コピー完了: $destJsonl"

# ── 3. Gemini用Markdown生成 ────────────────────────────────────────────
$mdPath = Join-Path $destDir "$($dateStr)_summary.md"
$lines = Get-Content -Path $jsonl.FullName -Encoding UTF8 -ErrorAction SilentlyContinue

$mdContent = @"
# Claude CLI セッションログ - $dateStr

## メタ情報
- ソース: $($jsonl.FullName)
- 取得日時: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- 行数: $($lines.Count)

## セッション内容

"@

foreach ($line in $lines) {
    try {
        $obj = $line | ConvertFrom-Json -ErrorAction Stop
        $role = if ($obj.role) { $obj.role } else { "unknown" }
        $text = ""
        if ($obj.content -is [string]) {
            $text = $obj.content
        } elseif ($obj.content -is [array]) {
            $text = ($obj.content | Where-Object { $_.type -eq "text" } | ForEach-Object { $_.text }) -join ""
        }
        if ($text) {
            $mdContent += "### [$role]`n$text`n`n"
        }
    } catch {
        # パースできない行はスキップ
    }
}

$mdContent | Out-File -FilePath $mdPath -Encoding UTF8 -Force
Write-Output "Gemini用Markdown生成: $mdPath"

# ── 4. コミット連番を取得 ──────────────────────────────────────────────
Set-Location $repoRoot

$commitCount = (git rev-list --count HEAD 2>$null)
if (-not $commitCount) { $commitCount = 0 }
$serial = "{0:D4}" -f ([int]$commitCount + 1)

# ── 5. git add / commit / push ────────────────────────────────────────
$commitMsg = "v$Version - $serial`: [Claude] ログ同期 $dateStr"

try {
    git add "$destJsonl" "$mdPath"
    git commit -m $commitMsg
    git push
    Write-Output "Git push 完了: $commitMsg"
} catch {
    Write-Error "Git操作に失敗しました: $_"
    exit 1
}
