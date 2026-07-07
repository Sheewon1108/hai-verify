# Register Hai-Ic keepalive (logon + every 5 min). Requires timezone assert.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/register-hai-ic-autostart.ps1

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
. (Join-Path $ProjectRoot "scripts\lib\scheduled-task-guard.ps1")

Assert-UserTimezoneForScheduling

$ensure = Join-Path $ProjectRoot "scripts\ensure-hai-ic-running.ps1"
$taskName = "Hai-Ic-KeepAlive"

Write-ScheduledTaskTimezoneNote -TaskName $taskName -ScheduleDescription "At logon + every 5 minutes (local Pacific time)"

$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing) { Unregister-ScheduledTask -TaskName $taskName -Confirm:$false }

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$ensure`"" `
  -WorkingDirectory $ProjectRoot

$logon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$repeat = New-ScheduledTaskTrigger -Once -At (Get-Date).Date.AddHours(8) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($logon, $repeat) -Settings $settings -Description "Keep Hai-Ic server on :3001 (Pacific local time)" -RunLevel Limited | Out-Null

Write-Host "Registered: $taskName"
Write-Host "Running ensure now..."
& $ensure