$workspace = Join-Path $PSScriptRoot "..\hai-verify.code-workspace" | Resolve-Path
$cursorCandidates = @(
  "$env:LOCALAPPDATA\Programs\cursor\Cursor.exe",
  "$env:ProgramFiles\Cursor\Cursor.exe",
  (Get-Command cursor -ErrorAction SilentlyContinue).Source
) | Where-Object { $_ -and (Test-Path $_) } | Select-Object -Unique -First 1

if (-not $cursorCandidates) {
  Write-Host "Cursor not found. Open this file manually in Cursor:"
  Write-Host $workspace
  exit 1
}

Start-Process $cursorCandidates -ArgumentList "`"$workspace`""
Write-Host "Opened: $workspace"