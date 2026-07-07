$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$path = Join-Path $root "hai-ic\hiring\GITHUB-SECRETS-STEPS.txt"
Start-Process notepad.exe $path
Start-Process "https://github.com/Sheewon1108/hai-verify/settings/secrets/actions"
Write-Host "Opened steps + GitHub Secrets page (browser). Do not paste tokens in chat."