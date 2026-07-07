# User context policy
# - Multi-timezone countries (US): inferring WHICH zone is FORBIDDEN
# - Single-timezone countries (Korea): one national zone, but language still != residence
# - Phone area code / language: never infer USER_TIMEZONE
# - USER_TIMEZONE: authoritative (must match Windows in strict mode)

$UserContextLibRoot = $PSScriptRoot

. (Join-Path $UserContextLibRoot "phone-area-policy.ps1")
. (Join-Path $UserContextLibRoot "timezone-model-policy.ps1")

function Get-UserContextFromConfig {
  $envFile = Join-Path $env:USERPROFILE "secrets\hai-verify.env"
  $ctx = [ordered]@{
    Timezone      = "Pacific Standard Time"
    Region        = "California, US"
    DisplayLocale = ""
    ContactPhone  = ""
    Country       = "US"
  }

  if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
      $line = $_.Trim()
      if ($line -match '^USER_TIMEZONE=(.+)$') { $ctx.Timezone = $matches[1].Trim() }
      if ($line -match '^USER_REGION=(.+)$') { $ctx.Region = $matches[1].Trim() }
      if ($line -match '^USER_COUNTRY=(.+)$') { $ctx.Country = $matches[1].Trim() }
      if ($line -match '^USER_DISPLAY_LOCALE=(.+)$') { $ctx.DisplayLocale = $matches[1].Trim() }
      if ($line -match '^USER_CONTACT_PHONE=(.+)$') { $ctx.ContactPhone = $matches[1].Trim() }
    }
  }

  return [pscustomobject]$ctx
}

function Assert-UserContext {
  param(
    [switch]$Strict
  )

  $cfg = Get-UserContextFromConfig
  $actual = Get-TimeZone
  $now = Get-Date -Format "yyyy-MM-dd HH:mm zzz"
  $localeNote = if ($cfg.DisplayLocale) { $cfg.DisplayLocale } else { "(none)" }

  # 1) Windows timezone must match declared USER_TIMEZONE (authoritative)
  if ($actual.Id -ne $cfg.Timezone) {
    $msg = @"
USER CONTEXT MISMATCH (Windows vs USER_TIMEZONE)
  Residence:        $($cfg.Region) (metadata — does not override timezone)
  USER_TIMEZONE:    $($cfg.Timezone)
  Windows timezone: $($actual.Id)
  Contact phone:    $($cfg.ContactPhone) (area code does NOT set timezone)
  Display locale:   $localeNote

Policy: Never infer timezone from language, en-US, or phone area code.
Fix: Confirm with user, update ~/secrets/hai-verify.env, then:
      Set-TimeZone -Id "$($cfg.Timezone)"
"@
    if ($Strict) { Write-Error $msg; exit 1 }
    Write-Warning $msg
    return $false
  }

  # 2) Timezone model + decoupling notes
  $tzModel = Get-TimezoneModelForContext -Region $cfg.Region -Country $cfg.Country
  $notes = @(
    "country=$($cfg.Country) model=$($tzModel.Model) ($($tzModel.Label))",
    $tzModel.Rule,
    "locale=$localeNote (display only)"
  )
  if ($cfg.ContactPhone) {
    $hint = Get-AreaCodeZoneHint -Phone $cfg.ContactPhone
    if ($hint) {
      if ($hint.Timezone -and $hint.Timezone -ne $cfg.Timezone) {
        $notes += "phone $($hint.AreaCode) hints $($hint.Label) but USER_TIMEZONE=$($cfg.Timezone) — OK (decoupled)"
      } else {
        $notes += "phone $($hint.AreaCode) $($hint.Label)"
      }
    }
  }
  if ($cfg.Region -match 'california|pacific|west' -and $cfg.Timezone -eq 'Eastern Standard Time') {
    $notes += "West residence + Eastern USER_TIMEZONE — OK (explicit choice)"
  }
  if ($cfg.Region -match 'eastern|east coast|new york' -and $cfg.Timezone -eq 'Pacific Standard Time') {
    $notes += "East residence + Pacific USER_TIMEZONE — OK (explicit choice)"
  }

  Write-Host "User context OK: residence=$($cfg.Region) | tz=$($actual.Id) | $now"
  $notes | ForEach-Object { Write-Host "  $_" }
  return $true
}