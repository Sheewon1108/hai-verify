param(
  [string]$ProjectRoot = (Join-Path $PSScriptRoot "..")
)

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$backupRoot = Join-Path (Split-Path $ProjectRoot -Parent) "backups"
$destination = Join-Path $backupRoot "hai-verify-$timestamp"

New-Item -ItemType Directory -Path $destination -Force | Out-Null
robocopy $ProjectRoot $destination /E /XD node_modules .next .wrangler /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

Push-Location $ProjectRoot
git add -A 2>$null
$commit = git commit -m "backup: auto snapshot $timestamp" 2>&1
Pop-Location

Write-Host "Filesystem backup: $destination"
Write-Host $commit