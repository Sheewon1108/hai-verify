# Local health check — no external API tokens required.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/local-doctor.ps1

$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $ProjectRoot

$ok = 0
$warn = 0
$fail = 0

function Report {
  param([string]$Name, [bool]$Pass, [string]$Detail, [switch]$Warning)
  if ($Pass) {
    $script:ok++
    Write-Host "[OK]   $Name — $Detail"
  } elseif ($Warning) {
    $script:warn++
    Write-Host "[WARN] $Name — $Detail"
  } else {
    $script:fail++
    Write-Host "[FAIL] $Name — $Detail"
  }
}

Write-Host "HAI Verify local doctor (no external tokens)"
Write-Host ""

# 1) User context
try {
  . (Join-Path $ProjectRoot "scripts\lib\with-user-context.ps1")
  Enter-ScriptWithUserContext | Out-Null
  Report "User context" $true "timezone assert passed"
} catch {
  Report "User context" $false $_.Exception.Message
}

# 2) Vault
$vaultPath = Join-Path $env:USERPROFILE "secrets\vault.dat"
Report "DPAPI vault" (Test-Path $vaultPath) $(if (Test-Path $vaultPath) { "found" } else { "missing — npm run vault:migrate" })

# 3) PM2
try {
  $pm2List = pm2 pid hai-ic-server 2>$null
  $pidVal = ($pm2List | Out-String).Trim()
  $online = $pidVal -match '^\d+$'
  Report "PM2 hai-ic-server" $online $(if ($online) { "pid=$pidVal" } else { "not running — pm2 start ecosystem.config.cjs" })
} catch {
  Report "PM2" $false "pm2 not available"
}

# 4) Port bind
$listen = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
$localhostOnly = (-not $listen) -or ($listen.LocalAddress -eq "127.0.0.1")
Report "Port 3001 localhost" $localhostOnly $(if ($listen) { $listen.LocalAddress } else { "not listening" }) -Warning:(-not $listen)

# 5) API health
try {
  $health = Invoke-RestMethod "http://localhost:3001/api/health" -TimeoutSec 8
  Report "/api/health" ($health.ok -eq $true) "mode=$($health.mode)"
} catch {
  Report "/api/health" $false "not reachable — pm2 restart hai-ic-server"
}

# 6) hai-ic analyze
try {
  $body = '{"input":"local doctor check"}'
  $analyze = Invoke-RestMethod "http://localhost:3001/api/hai-ic/analyze" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 8
  Report "/api/hai-ic/analyze" ($analyze.ok -eq $true) "confidence=$($analyze.confidence)"
} catch {
  Report "/api/hai-ic/analyze" $false $_.Exception.Message
}

# 7) Optional tokens (warn only)
$optional = @("OPENAI_API_KEY", "CLOUDFLARE_API_TOKEN", "DISCORD_TOKEN", "STRIPE_SECRET_KEY")
$vaultScript = Join-Path $ProjectRoot "scripts\lib\secrets-vault.ps1"
$vaultJson = & $vaultScript export-json 2>$null
$vaultObj = if ($vaultJson) { $vaultJson | ConvertFrom-Json } else { $null }
foreach ($k in $optional) {
  $val = $null
  if ($vaultObj) { $val = $vaultObj.$k }
  $has = $val -and $val -notmatch 'placeholder|\.\.\.'
  if (-not $has) {
    Report "Vault $k" $true "not set (optional for local)" -Warning
  } else {
    Report "Vault $k" $true "set (ready when needed)"
  }
}

Write-Host ""
Write-Host "Summary: OK=$ok WARN=$warn FAIL=$fail"
if ($fail -gt 0) { exit 1 }
exit 0