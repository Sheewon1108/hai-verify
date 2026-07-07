$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $root "scripts\lib\with-user-context.ps1")
Enter-ScriptWithUserContext -Strict
Set-Location $root

Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }

pm2 delete hai-ic-server, hai-ic-automation, hai-verify 2>$null
pm2 start ecosystem.config.cjs
pm2 save

Start-Sleep -Seconds 10
try {
  $h = Invoke-RestMethod http://localhost:3001/api/hai-ic/health -TimeoutSec 15
  Write-Host "hai-ic-server: $($h.status) on :3001"
} catch {
  Write-Host "hai-ic-server: starting..."
}
Write-Host "hai-ic-automation: hourly score + health watch + daily report"
Write-Host "Demo: http://localhost:3001/hai-ic"
Write-Host "Log: hai-ic/BOOST-LOG.md"