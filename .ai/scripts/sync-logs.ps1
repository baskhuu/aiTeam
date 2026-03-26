# sync-logs.ps1
# 役割: Claude Code CLI の Stop hook から呼ばれ、sync-logs.js を実行する

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

$repoRoot = $PSScriptRoot | Split-Path | Split-Path
Set-Location $repoRoot

npm run sync
