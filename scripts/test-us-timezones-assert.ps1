# Verify user-context assert passes for all 4 US timezones.
# Restores original Windows timezone + USER_TIMEZONE when done.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/test-us-timezones-assert.ps1

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$EnvPath = Join-Path $env:USERPROFILE "secrets\hai-verify.env"
$AssertScript = Join-Path $ProjectRoot "scripts\lib\assert-user-timezone.ps1"

$zones = @(
  "Pacific Standard Time",
  "Mountain Standard Time",
  "Central Standard Time",
  "Eastern Standard Time"
)

if (-not (Test-Path $EnvPath)) {
  Write-Error "Missing config: $EnvPath"
  exit 1
}

$originalWindowsTz = (Get-TimeZone).Id
$originalEnvLine = (Select-String -Path $EnvPath -Pattern '^USER_TIMEZONE=' | Select-Object -First 1).Line
if (-not $originalEnvLine) {
  Write-Error "USER_TIMEZONE not found in $EnvPath"
  exit 1
}

function Set-UserTimezoneInEnv {
  param([string]$Timezone)
  $lines = Get-Content $EnvPath
  $out = foreach ($line in $lines) {
    if ($line -match '^USER_TIMEZONE=') { "USER_TIMEZONE=$Timezone" } else { $line }
  }
  $out | Set-Content $EnvPath -Encoding UTF8
}

function Invoke-Assert {
  & $AssertScript
  return $LASTEXITCODE
}

Write-Host "US 4-zone assert test (residence stays California, US)"
Write-Host "Original Windows TZ: $originalWindowsTz"
Write-Host "Original env: $originalEnvLine"
Write-Host ""

$results = @()
$allOk = $true

try {
  foreach ($tz in $zones) {
    Write-Host "--- $tz ---"
    Set-TimeZone -Id $tz
    Set-UserTimezoneInEnv -Timezone $tz
    $code = Invoke-Assert
    $ok = $code -eq 0
    if (-not $ok) { $allOk = $false }
    $results += [pscustomobject]@{ Timezone = $tz; Pass = $ok; ExitCode = $code }
    Write-Host ""
  }
} finally {
  Write-Host "Restoring original timezone..."
  Set-TimeZone -Id $originalWindowsTz
  if ($originalEnvLine -match '^USER_TIMEZONE=(.+)$') {
    Set-UserTimezoneInEnv -Timezone $matches[1].Trim()
  }
  $restoreCode = Invoke-Assert
  Write-Host "Restore assert exit: $restoreCode"
}

Write-Host ""
Write-Host "=== RESULTS ==="
$results | Format-Table Timezone, Pass, ExitCode -AutoSize

if ($allOk) {
  Write-Host "All 4 US timezones: PASS"
  exit 0
}

Write-Host "FAILED: one or more timezones did not pass assert"
exit 1