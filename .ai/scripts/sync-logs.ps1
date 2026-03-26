# sync-logs.ps1
# 役割: ~/.claude/projects/ の最新JSONLを .ai/logs/claude_cli/ にコピーし、
#       Gemini用Markdownサマリーを生成して git commit & push する

param(
    [string]$Version = ""   # 空の場合は .ai/VERSION から自動読み込み（TLが明示指定した場合のみ上書き）
)

$ErrorActionPreference = "Stop"
# コンソール・パイプの文字コードをUTF-8に統一（Windows文字化け防止）
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

# スクリプトの2階層上がリポジトリルート（.ai/scripts/ -> .ai/ -> リポジトリルート）
$repoRoot = $PSScriptRoot | Split-Path | Split-Path

# ── バージョン管理: .ai/VERSION ファイルから読み込む ──────────────
$versionFile = Join-Path $repoRoot ".ai\VERSION"
if (-not $Version) {
    if (Test-Path $versionFile) {
        $Version = (Get-Content $versionFile -Encoding UTF8 -Raw).Trim()
        Write-Output "バージョン読み込み: v$Version (.ai/VERSION)"
    } else {
        $Version = "0.0.1"
        Write-Warning ".ai/VERSION が見つかりません。デフォルト v$Version を使用します。"
    }
} else {
    Write-Output "バージョン上書き: v$Version (パラメータ指定)"
}

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

# ── ステップ5: AITEAM_HISTORY.md にセッションサマリーを追記 ──────
$historyPath = Join-Path $repoRoot ".ai\AITEAM_HISTORY.md"
if (Test-Path $historyPath) {
    # 最初のユーザーメッセージを取得（セッション概要として）
    $firstUserMsg = ""
    foreach ($line in $lines) {
        try {
            $obj = $line | ConvertFrom-Json -ErrorAction Stop
            if ($obj.type -eq "user") {
                $msg = $obj.message
                if ($msg -and $msg.content) {
                    if ($msg.content -is [string]) {
                        $firstUserMsg = $msg.content.Trim()
                    } elseif ($msg.content -is [array]) {
                        $firstUserMsg = ($msg.content | Where-Object { $_.type -eq "text" } | Select-Object -First 1).text
                        if ($firstUserMsg) { $firstUserMsg = $firstUserMsg.Trim() }
                    }
                    if ($firstUserMsg) { break }
                }
            }
        } catch {}
    }
    if ($firstUserMsg.Length -gt 80) {
        $firstUserMsg = $firstUserMsg.Substring(0, 80) + "..."
    }

    $today = Get-Date -Format "yyyy-MM-dd"
    $historyContent = Get-Content -Path $historyPath -Raw -Encoding UTF8

    # 日付セクションが未存在なら追加
    $dateSectionHeader = "## $today — セッションログ"
    if ($historyContent -notmatch [regex]::Escape($dateSectionHeader)) {
        $newSection = "`n---`n`n$dateSectionHeader`n"
        [System.IO.File]::AppendAllText($historyPath, $newSection, [System.Text.Encoding]::UTF8)
    }

    $sessionEntry = "`n- ``$dateStr`` [サマリー](.ai/logs/claude_cli/$($dateStr)_summary.md) — $firstUserMsg"
    [System.IO.File]::AppendAllText($historyPath, $sessionEntry, [System.Text.Encoding]::UTF8)
    Write-Output "AITEAM_HISTORY.md に追記: $dateStr"
}

# ── ステップ4: 差分があればgit commit & push ────────────────
Set-Location $repoRoot

# ?? (未追跡) を除いた変更行のみ取得
$staged = git status --porcelain 2>$null | Where-Object { $_ -notmatch "^\?\?" }
if ($staged) {
    # 直前コミットのバージョンが一致する場合のみ連番を継続、違う場合は0001にリセット
    $lastMsg = git log -1 --format="%s" 2>$null
    $serialNum = 0
    if ($lastMsg -match "^v$([regex]::Escape($Version)) - (\d{4}):") {
        $serialNum = [int]$Matches[1]
    } else {
        Write-Output "バージョン変更を検出 → 連番を0001にリセット"
    }
    $serial = "{0:D4}" -f ($serialNum + 1)
    $commitMsg = "v$Version - $serial`: [Claude] ログ同期 $dateStr"

    git add -u
    git add ".ai/AITEAM_HISTORY.md"
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
Write-Output "HISTORY    : $historyPath"
