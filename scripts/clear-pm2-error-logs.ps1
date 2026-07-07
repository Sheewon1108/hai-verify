# Truncate PM2 *-error.log files (keeps out.log for history).
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/clear-pm2-error-logs.ps1

$ErrorActionPreference = "Stop"

$logDir = Join-Path $env:USERPROFILE ".pm2\logs"
if (-not (Test-Path $logDir)) {
  Write-Host "PM2 log dir not found: $logDir"
  exit 0
}

$cleared = @()
$skipped = @()

Get-ChildItem -Path $logDir -Filter "*-error.log" -File | ForEach-Object {
  if ($_.Length -eq 0) {
    $skipped += $_.Name
    return
  }
  Clear-Content -Path $_.FullName
  $cleared += $_.Name
}

$time = Get-Date -Format "yyyy-MM-dd HH:mm"
if ($cleared.Count -gt 0) {
  Write-Host "[$time] Cleared $($cleared.Count) PM2 error log(s): $($cleared -join ', ')"
} else {
  Write-Host "[$time] No PM2 error logs to clear (already empty: $($skipped -join ', '))"
}