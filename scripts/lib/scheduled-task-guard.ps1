# Required before any Windows scheduled-task registration.
# Dot-source: . (Join-Path $ProjectRoot "scripts\lib\scheduled-task-guard.ps1")

. (Join-Path $PSScriptRoot "user-context.ps1")

function Assert-UserTimezoneForScheduling {
  $null = Assert-UserContext -Strict
}

function Write-ScheduledTaskTimezoneNote {
  param([string]$TaskName, [string]$ScheduleDescription)
  $cfg = Get-UserContextFromConfig
  $now = Get-Date -Format "yyyy-MM-dd HH:mm zzz"
  Write-Host "Registering '$TaskName' in $($cfg.Region) ($($cfg.Timezone), $now)"
  Write-Host "Schedule: $ScheduleDescription"
}