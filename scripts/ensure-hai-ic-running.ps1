$ProjectRoot = "C:\Users\jaytr\Desktop\Codex\hai-verify"
. (Join-Path $ProjectRoot "scripts\lib\with-user-context.ps1")
Enter-ScriptWithUserContext
Set-Location $ProjectRoot

function Test-HaiIc {
  try {
    $h = Invoke-RestMethod "http://localhost:3001/api/hai-ic/health" -TimeoutSec 8
    return $h.status -eq "healthy"
  } catch { return $false }
}

if (Test-HaiIc) { exit 0 }

# try PM2 resurrect first
pm2 resurrect 2>$null | Out-Null
Start-Sleep -Seconds 12
if (Test-HaiIc) { exit 0 }

# start fresh
pm2 start ecosystem.config.cjs 2>$null | Out-Null
Start-Sleep -Seconds 12
if (Test-HaiIc) {
  pm2 save --force 2>$null | Out-Null
  exit 0
}

# last resort: direct dev (background via pm2 only)
pm2 start ecosystem.config.cjs --only hai-ic-server 2>$null | Out-Null
exit 0