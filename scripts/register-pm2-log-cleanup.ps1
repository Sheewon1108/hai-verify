# Register daily PM2 error-log cleanup. Requires timezone assert.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/register-pm2-log-cleanup.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
. (Join-Path $ProjectRoot "scripts\lib\scheduled-task-guard.ps1")

Assert-UserTimezoneForScheduling

$clearScript = Join-Path $ProjectRoot "scripts\clear-pm2-error-logs.ps1"
$taskName = "Hai-Ic-PM2-ErrorLog-Cleanup"

Write-ScheduledTaskTimezoneNote -TaskName $taskName -ScheduleDescription "Daily at 3:00 AM (local Pacific time)"

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) {
  Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
  Write-Host "Removed previous task: $taskName"
}

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$clearScript`"" `
  -WorkingDirectory $ProjectRoot

$daily = New-ScheduledTaskTrigger -Daily -At "3:00AM"

$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $daily `
  -Settings $settings `
  -Description "Truncate PM2 error logs daily 3AM Pacific (hai-verify)" `
  -RunLevel Limited | Out-Null

Write-Host "Registered: $taskName"
Write-Host "Manual run: powershell -File `"$clearScript`""
Write-Host ""
Write-Host "Running cleanup now..."
& $clearScript