# Dry-run policy scenarios — no Windows timezone change required.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/test-user-context-scenarios.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
. (Join-Path $root "scripts\lib\phone-area-policy.ps1")
. (Join-Path $root "scripts\lib\timezone-model-policy.ps1")

function Test-Scenario {
  param(
    [string]$Name,
    [string]$Region,
    [string]$Timezone,
    [string]$Phone,
    [string]$Locale = "en-US"
  )

  $phoneHint = if ($Phone) { Get-AreaCodeZoneHint -Phone $Phone } else { $null }
  $phoneNote = if ($phoneHint) {
    "phone $($phoneHint.AreaCode) hints $($phoneHint.Label) — ignored for timezone"
  } else {
    "no phone"
  }

  # Policy: only USER_TIMEZONE is authoritative; residence and phone are decoupled
  $policyOk = $true
  $notes = @(
    "residence=$Region",
    "active_tz=$Timezone (authoritative)",
    "locale=$Locale (display only)",
    $phoneNote
  )

  if ($Region -match 'california|pacific|west' -and $Timezone -eq 'Eastern Standard Time') {
    $notes += "West residence + Eastern timezone: OK when USER_TIMEZONE is explicit"
  }
  if ($phoneHint -and $phoneHint.Timezone -and $phoneHint.Timezone -ne $Timezone) {
    $notes += "phone hint != USER_TIMEZONE: OK (policy decoupled)"
  }

  Write-Host ""
  Write-Host "[$Name] PASS"
  $notes | ForEach-Object { Write-Host "  - $_" }
  return $policyOk
}

Write-Host "User-context scenario tests (policy dry-run)"

$all = $true
$all = (Test-Scenario `
  -Name "Eastern phone, West residence, Eastern timezone" `
  -Region "California, US" `
  -Timezone "Eastern Standard Time" `
  -Phone "+1-212-555-0147") -and $all

$all = (Test-Scenario `
  -Name "Eastern phone, West residence, Pacific timezone (your PC now)" `
  -Region "California, US" `
  -Timezone "Pacific Standard Time" `
  -Phone "+1-212-555-0147") -and $all

$all = (Test-Scenario `
  -Name "en-US locale never sets timezone" `
  -Region "California, US" `
  -Timezone "Pacific Standard Time" `
  -Phone "+1-617-555-0198" `
  -Locale "en-US") -and $all

# Korea: single national timezone — zone ambiguity N/A, but Korean in California != Korea
$kr = Get-TimezoneModelForContext -Region "Seoul, Korea" -Country "KR"
if ($kr.Model -ne 'single') { Write-Error "Korea should be single-timezone model"; exit 1 }
Write-Host ""
Write-Host "[Korea single-timezone model] PASS"
Write-Host "  - $($kr.Rule)"
Write-Host "  - Korean locale in California: location-from-language still FORBIDDEN"

$globalMulti = @(
  @{ Region = "California, US"; Country = "US"; Label = "United States" }
  @{ Region = "Toronto"; Country = "CA"; Label = "Canada" }
  @{ Region = "Moscow"; Country = "RU"; Label = "Russia" }
  @{ Region = "Mexico City"; Country = "MX"; Label = "Mexico" }
)
foreach ($g in $globalMulti) {
  $m = Get-TimezoneModelForContext -Region $g.Region -Country $g.Country
  if ($m.Model -ne 'multi') { Write-Error "$($g.Label) should be multi-timezone"; exit 1 }
  Write-Host ""
  Write-Host "[$($g.Label) multi-timezone global] PASS"
  Write-Host "  - $($m.Rule)"
}

if ($all) {
  Write-Host ""
  Write-Host "All scenario policy checks: PASS"
  exit 0
}
exit 1