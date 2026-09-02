# War room status board — local security snapshot (no external tokens).
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

Write-Host "=== HAI VERIFY WAR ROOM ===" -ForegroundColor Cyan
Write-Host (Get-Date -Format "yyyy-MM-dd HH:mm zzz")
Write-Host ""

# Port
$listen = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listen) {
  $ok = $listen.LocalAddress -eq "127.0.0.1"
  $mark = if ($ok) { "OK" } else { "ALERT" }
  Write-Host "[$mark] Port 3001 bind: $($listen.LocalAddress)"
} else {
  Write-Host "[WARN] Port 3001 not listening"
}

# Vault
$vault = Join-Path $env:USERPROFILE "secrets\vault.dat"
Write-Host "$(if (Test-Path $vault) { '[OK]' } else { '[FAIL]' }) DPAPI vault: $vault"

# Latest restore point
$rp = Get-ChildItem (Join-Path $env:USERPROFILE "secrets\restore-points") -Directory -ErrorAction SilentlyContinue |
  Sort-Object Name -Descending | Select-Object -First 1
if ($rp) { Write-Host "[OK] Latest restore point: $($rp.FullName)" } else { Write-Host "[WARN] No restore point yet — npm run backup:restore-point" }

# PM2
try {
  $pm2 = pm2 jlist 2>$null | ConvertFrom-Json
  $srv = $pm2 | Where-Object { $_.name -eq "hai-ic-server" } | Select-Object -First 1
  if ($srv -and $srv.pm2_env.status -eq "online") { Write-Host "[OK] PM2 hai-ic-server online" }
  else { Write-Host "[WARN] PM2 hai-ic-server not online" }
} catch { Write-Host "[WARN] PM2 unavailable" }

# Health
try {
  $h = Invoke-RestMethod "http://127.0.0.1:3001/api/health" -TimeoutSec 6
  Write-Host "[OK] /api/health mode=$($h.mode)"
} catch { Write-Host "[WARN] /api/health unreachable" }

Write-Host ""
Write-Host "War room rules: .cursor/rules/war-room.mdc"
Write-Host "MODE: BLIND OFF — all rooms (Owner 2026-09-02) | 실행 90 / 의견 10 + 50/50 — NO LOOP"
Write-Host "Re-enable blind: completely blind | close: hai-ic/WR-CLOSE-5050.md | secrets never in chat"
Write-Host "No secrets in chat. Owner: money/family/law. Partner: product half when unlocked."