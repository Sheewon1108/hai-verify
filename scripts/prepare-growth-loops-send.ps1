# DEPRECATED — use prepare-pitch-send-pack.ps1 (all targets + sincerity gate)
Write-Host ""
Write-Host "Redirecting to prepare-pitch-send-pack.ps1 (validated send pack)..." -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "prepare-pitch-send-pack.ps1")