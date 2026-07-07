# Verify loopback bypass: 127.0.0.1 allowed, tunnel/external Host blocked without key.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/test-access-loopback.ps1 [tunnelUrl]

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$EnvPath = Join-Path $env:USERPROFILE "secrets\hai-verify.env"
$tunnelUrl = $args[0]

if (-not (Test-Path $EnvPath)) {
  Write-Error "Missing config: $EnvPath"
  exit 1
}

$VaultScript = Join-Path $ProjectRoot "scripts\lib\secrets-vault.ps1"
$vaultJson = & $VaultScript export-json 2>$null
$vaultObj = if ($vaultJson) { $vaultJson | ConvertFrom-Json } else { $null }
$internalKey = $vaultObj.HAI_INTERNAL_API_KEY
if (-not $internalKey) {
  $internalKey = (Select-String -Path $EnvPath -Pattern '^HAI_INTERNAL_API_KEY=' -ErrorAction SilentlyContinue | Select-Object -First 1).Line -replace '^HAI_INTERNAL_API_KEY=', ''
}
if (-not $internalKey) {
  Write-Error "HAI_INTERNAL_API_KEY not found in vault or $EnvPath"
  exit 1
}
$body = '{"content":"access loopback test"}'

function Probe-Verify {
  param(
    [string]$Label,
    [string]$Url,
    [hashtable]$Headers = @{},
    [int]$ExpectStatus
  )
  try {
    $r = Invoke-WebRequest -Uri $Url -Method POST -Body $body -ContentType "application/json" -Headers $Headers -UseBasicParsing -TimeoutSec 20
    $status = $r.StatusCode
    $detail = $r.Content.Substring(0, [Math]::Min(80, $r.Content.Length))
  } catch {
    $status = $_.Exception.Response.StatusCode.value__
    $detail = $_.ErrorDetails.Message
    if (-not $detail) { $detail = $_.Exception.Message }
  }
  $pass = $status -eq $ExpectStatus
  $mark = if ($pass) { "PASS" } else { "FAIL" }
  Write-Host "[$mark] $Label — expected HTTP $ExpectStatus, got HTTP $status"
  if (-not $pass) { Write-Host "       $detail" }
  return $pass
}

Write-Host "Access loopback test (HAI_ACCESS_LOCAL_BYPASS should be true for local allow)"
Write-Host ""

$results = @()
$results += Probe-Verify "local 127.0.0.1 no auth" "http://127.0.0.1:3001/api/verify" @{} 200
$results += Probe-Verify "local 127.0.0.1 with key" "http://127.0.0.1:3001/api/verify" @{ Authorization = "Bearer $internalKey" } 200

if ($tunnelUrl) {
  $base = $tunnelUrl.TrimEnd('/')
  $tunnelHeaders = @{ "Bypass-Tunnel-Reminder" = "true" }
  $results += Probe-Verify "tunnel no auth (external Host)" "$base/api/verify" $tunnelHeaders 401
  $results += Probe-Verify "tunnel with key" "$base/api/verify" (@{ "Bypass-Tunnel-Reminder" = "true"; Authorization = "Bearer $internalKey" }) 200
} else {
  Write-Host "[SKIP] tunnel — pass URL: npm run access:test-loopback -- https://....loca.lt"
}

$failed = @($results | Where-Object { $_ -eq $false }).Count
if ($failed -gt 0) {
  Write-Host ""
  Write-Error "$failed check(s) failed"
  exit 1
}

Write-Host ""
Write-Host "All access loopback checks: PASS"