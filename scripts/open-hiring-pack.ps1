# Open hiring interview pack for KARAM (no auto-recruit).
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$pack = Join-Path $root "hai-ic\hiring\INTERVIEW-PACK.md"
if (-not (Test-Path $pack)) { Write-Error "Missing $pack"; exit 1 }
Start-Process notepad.exe $pack
Write-Host "Opened: $pack"
Write-Host "Post job on ONE site. You interview. AI does not pick people."