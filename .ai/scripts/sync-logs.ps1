# sync-logs.ps1
# .ai/logs の最新 JSONL ファイルをコピーし、Gitでコミット＆プッシュする

$logsDir = Join-Path $PWD '.ai\logs'
if (-not (Test-Path $logsDir)) {
    Write-Error "ログディレクトリが存在しません: $logsDir"
    exit 1
}

# 最新の JSONL ファイルを選択
$jsonl = Get-ChildItem -Path $logsDir -Filter '*.jsonl' | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if (-not $jsonl) {
    Write-Error "JSONL ファイルが見つかりません。"
    exit 1
}

# コピー先はカレントディレクトリ直下または指定されたパス
$targetDir = $args[0]
if (-not $targetDir) { $targetDir = $PWD }
if (-not (Test-Path $targetDir)) {
    Write-Error "コピー先ディレクトリが存在しません: $targetDir"
    exit 1
}

$targetPath = Join-Path $targetDir $jsonl.Name
Copy-Item -Path $jsonl.FullName -Destination $targetPath -Force
Write-Output "Copied $($jsonl.FullName) to $targetPath"

# Git push
Set-Location $PWD

try {
    git add "$targetPath"
    git commit -m "Sync latest logs: $($jsonl.Name)"
    git push
    Write-Output "Git push successful"
} catch {
    Write-Error "Git操作に失敗しました: $_"
    exit 1
}
