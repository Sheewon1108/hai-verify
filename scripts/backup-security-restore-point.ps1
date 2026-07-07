# Security restore-point backup — restart deploy/security work from this snapshot only.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/backup-security-restore-point.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
. (Join-Path $ProjectRoot "scripts\lib\with-user-context.ps1")
Enter-ScriptWithUserContext -Strict

$timestamp = Get-Date -Format "yyyy-MM-dd_HHmm"
$restoreRoot = Join-Path $env:USERPROFILE "secrets\restore-points\hai-verify-$timestamp"
$secretsDir = Join-Path $restoreRoot "secrets"
$projectDir = Join-Path $restoreRoot "project"

New-Item -ItemType Directory -Path $restoreRoot, $secretsDir, $projectDir -Force | Out-Null

robocopy $ProjectRoot $projectDir /E /XD node_modules .next .wrangler /XF .env.local /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null

foreach ($file in @("vault.dat", "hai-verify.env", "vault.meta.json")) {
  $src = Join-Path $env:USERPROFILE "secrets\$file"
  if (Test-Path $src) {
    Copy-Item $src (Join-Path $secretsDir $file)
  }
}

Push-Location $ProjectRoot
git rev-parse HEAD | Set-Content (Join-Path $restoreRoot "git-commit.txt") -Encoding utf8
git branch --show-current | Set-Content (Join-Path $restoreRoot "git-branch.txt") -Encoding utf8
git status -sb | Set-Content (Join-Path $restoreRoot "git-status.txt") -Encoding utf8
git log --oneline -5 | Set-Content (Join-Path $restoreRoot "git-log.txt") -Encoding utf8
Pop-Location

$pm2Dump = Join-Path $env:USERPROFILE ".pm2\dump.pm2"
if (Test-Path $pm2Dump) { Copy-Item $pm2Dump (Join-Path $restoreRoot "pm2-dump.pm2") }

$vaultScript = Join-Path $ProjectRoot "scripts\lib\secrets-vault.ps1"
$vaultJson = & $vaultScript export-json 2>$null
$keyNames = if ($vaultJson) { ($vaultJson | ConvertFrom-Json).PSObject.Properties.Name | Sort-Object } else { @() }

$manifest = @"
HAI Verify restore point: $timestamp
Path: $restoreRoot
Git: $(Get-Content (Join-Path $restoreRoot 'git-commit.txt') -Raw).Trim()
Vault keys: $($keyNames -join ', ')
"@
$manifest | Set-Content (Join-Path $restoreRoot "RESTORE-POINT.txt") -Encoding utf8

Write-Host "Restore point saved: $restoreRoot"
Write-Host "Git commit: $(Get-Content (Join-Path $restoreRoot 'git-commit.txt'))"
Write-Host "Vault keys: $($keyNames -join ', ')"