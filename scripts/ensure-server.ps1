# Single server on :3000 — kill duplicates, start production if down
$port = 3001
$project = Split-Path -Parent $PSScriptRoot

$listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listeners.Count -gt 1) {
  $listeners | Select-Object -Skip 1 | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
  }
}

if (-not $listeners) {
  Push-Location $project
  Start-Process -FilePath "npm" -ArgumentList "run","start" -WindowStyle Hidden -WorkingDirectory $project
  Pop-Location
  Start-Sleep -Seconds 6
}

try {
  $h = Invoke-RestMethod "http://localhost:$port/api/hai-ic/health" -TimeoutSec 10
  Write-Host "hai-ic server: $($h.status) on :$port"
} catch {
  Write-Host "hai-ic server: down"
  exit 1
}