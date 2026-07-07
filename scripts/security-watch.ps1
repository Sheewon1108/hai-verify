# XGOMA / HAI Verify — Hourly Security Watch
# Run once: powershell -ExecutionPolicy Bypass -File ./scripts/security-watch.ps1
# Runs every hour, shows Windows toast notification + updates report.html

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$reportPath  = Join-Path $projectRoot "security-report.html"

function Write-Report {
  param($checks, $status, $time)

  $color  = if ($status -eq "CLEAR") { "#10b981" } else { "#ef4444" }
  $icon   = if ($status -eq "CLEAR") { "&#9989;" } else { "&#128680;" }
  $rows   = $checks | ForEach-Object {
    $c = if ($_.ok) { "#10b981" } else { "#ef4444" }
    $i = if ($_.ok) { "&#9989;" } else { "&#10060;" }
    "<tr><td style='padding:10px 16px;color:#94a3b8'>$($_.name)</td><td style='padding:10px 16px;color:$c;font-weight:600'>$i $($_.result)</td></tr>"
  }

  $html = @"
<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'/>
  <meta http-equiv='refresh' content='3600'/>
  <title>XGOMA Security Report</title>
  <style>
    body{background:#0a0f1e;color:#e2e8f0;font-family:Inter,sans-serif;margin:0;padding:32px}
    h1{font-size:1.5rem;font-weight:700;color:#fff;margin-bottom:4px}
    .badge{display:inline-block;padding:4px 14px;border-radius:999px;font-size:.75rem;font-weight:700;background:$color;color:#fff;margin-bottom:24px}
    table{width:100%;border-collapse:collapse;background:#0d1526;border-radius:12px;overflow:hidden}
    th{padding:12px 16px;text-align:left;font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:#64748b;background:#111d35}
    tr:hover td{background:#111d35}
    .time{font-size:.8rem;color:#475569;margin-top:20px}
    .reload{margin-top:16px;font-size:.8rem;color:#475569}
  </style>
</head>
<body>
  <h1>$icon XGOMA Security Report</h1>
  <div class='badge'>$status</div>
  <table>
    <thead><tr><th>Check</th><th>Result</th></tr></thead>
    <tbody>$($rows -join '')</tbody>
  </table>
  <div class='time'>Last checked: $time</div>
  <div class='reload'>Auto-refreshes every hour. Or <a href='' style='color:#10b981'>refresh manually</a>.</div>
</body>
</html>
"@
  $html | Out-File -FilePath $reportPath -Encoding UTF8
}

function Show-Toast {
  param($title, $message, $isAlert)
  Add-Type -AssemblyName System.Windows.Forms
  $icon = if ($isAlert) { [System.Windows.Forms.ToolTipIcon]::Error } else { [System.Windows.Forms.ToolTipIcon]::Info }
  $notify = New-Object System.Windows.Forms.NotifyIcon
  $notify.Icon = [System.Drawing.SystemIcons]::Shield
  $notify.Visible = $true
  $notify.ShowBalloonTip(8000, $title, $message, $icon)
  Start-Sleep -Seconds 9
  $notify.Dispose()
}

function Run-SecurityCheck {
  $time   = Get-Date -Format "yyyy-MM-dd HH:mm UTC"
  $checks = @()
  $allOk  = $true

  # 1. Stripe live key exposure in source
  $leakFiles = Get-ChildItem -Path $projectRoot -Recurse -Include "*.ts","*.js","*.json" |
    Where-Object { $_.FullName -notmatch "node_modules|\.next|\.example" } |
    Where-Object { Select-String -Path $_.FullName -Pattern "sk_live_|rk_live_|pk_live_" -Quiet }
  $ok1 = $leakFiles.Count -eq 0
  if (-not $ok1) { $allOk = $false }
  $checks += @{ name = "Stripe live key in code"; ok = $ok1; result = if ($ok1) { "Clean" } else { "KEY EXPOSED!" } }

  # 2. .env.local git 추적 여부
  Push-Location $projectRoot
  $tracked = git ls-files .env.local 2>$null
  Pop-Location
  $ok2 = [string]::IsNullOrEmpty($tracked)
  if (-not $ok2) { $allOk = $false }
  $checks += @{ name = ".env.local not in git"; ok = $ok2; result = if ($ok2) { "Safe" } else { "TRACKED BY GIT!" } }

  # 3. .env.local 존재 여부 (키 설정 확인)
  $envExists = Test-Path (Join-Path $projectRoot ".env.local")
  $checks += @{ name = ".env.local exists locally"; ok = $envExists; result = if ($envExists) { "Found" } else { "Missing - keys not set" } }

  # 3d. User context: timezone/region from config only (never infer from language)
  . (Join-Path $projectRoot "scripts\lib\user-context.ps1")
  $cfg = Get-UserContextFromConfig
  $actualTz = (Get-TimeZone).Id
  $ok3tz = $actualTz -eq $cfg.Timezone
  if (-not $ok3tz) { $allOk = $false }
  $checks += @{
    name   = "User context (timezone/region)"
    ok     = $ok3tz
    result = if ($ok3tz) { "OK ($actualTz, $($cfg.Region))" } else { "MISMATCH: expected $($cfg.Timezone), got $actualTz" }
  }

  # 3e. DPAPI vault - API keys should not be plaintext in env files
  $vaultPath = Join-Path $env:USERPROFILE "secrets\vault.dat"
  $vaultOk = Test-Path $vaultPath
  $plaintextLeaks = @()
  $envPaths = @(
    (Join-Path $env:USERPROFILE "secrets\hai-verify.env"),
    (Join-Path $env:USERPROFILE "secrets\desktop.env"),
    (Join-Path $env:USERPROFILE "secrets\core-crypto.env")
  )
  foreach ($ep in $envPaths) {
    if (Test-Path $ep) {
      $hits = Select-String -Path $ep -Pattern "^OPENAI_API_KEY=|^HAI_API_KEY_SECRET=|^HAI_INTERNAL_API_KEY=|^CORE_CRYPTO_KEY=|^DISCORD_TOKEN=|^CLOUDFLARE_API_TOKEN=" -Quiet
      if ($hits) { $plaintextLeaks += (Split-Path $ep -Leaf) }
    }
  }
  $ok3d = $vaultOk -and ($plaintextLeaks.Count -eq 0)
  if (-not $ok3d) { $allOk = $false }
  $checks += @{
    name   = "DPAPI vault (no plaintext API keys)"
    ok     = $ok3d
    result = if ($ok3d) { "Vault OK" } elseif (-not $vaultOk) { "Missing vault - run: npm run vault:migrate" } else { "Plaintext in: $($plaintextLeaks -join ', ')" }
  }

  # 3a. dev server가 127.0.0.1에만 바인딩되는지
  $port3001 = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  $ok3a = (-not $port3001) -or ($port3001.LocalAddress -eq "127.0.0.1")
  if (-not $ok3a) { $allOk = $false }
  $bindAddr = if ($port3001) { $port3001.LocalAddress } else { "not listening" }
  $checks += @{
    name   = "Port 3001 localhost-only"
    ok     = $ok3a
    result = if ($ok3a) { "OK ($bindAddr)" } else { "EXPOSED on $bindAddr - fix start-hai-ic-dev.cjs" }
  }

  # 3b. 바탕화면/프로젝트에 흩어진 키 파일 검사
  $scattered = @()
  $desktopKeyGlob = Join-Path $env:USERPROFILE "Desktop\sk-proj-*.txt"
  if (Test-Path $desktopKeyGlob) { $scattered += Get-Item $desktopKeyGlob }
  $openAiTxt = Join-Path $projectRoot ".env. OPEN AI API KEY.txt"
  if (Test-Path $openAiTxt) { $scattered += $openAiTxt }
  $ok3b = $scattered.Count -eq 0
  if (-not $ok3b) { $allOk = $false }
  $checks += @{
    name   = "No scattered key files"
    ok     = $ok3b
    result = if ($ok3b) { "Clean" } else { "Found $($scattered.Count) file(s) - move to ~/secrets/" }
  }

  # 3c. Windows 네트워크가 Public이면 경고 (집 Wi-Fi는 Private 권장)
  $netProfile = Get-NetConnectionProfile -ErrorAction SilentlyContinue | Select-Object -First 1
  $ok3c = ($null -eq $netProfile) -or ($netProfile.NetworkCategory -ne "Public")
  if (-not $ok3c) { $allOk = $false }
  $checks += @{
    name   = "Network not Public profile"
    ok     = $ok3c
    result = if ($ok3c) { "OK" } else { "Public - set home Wi-Fi to Private in Settings" }
  }

  # 4. node_modules 존재 (의존성 설치 여부)
  $nmExists = Test-Path (Join-Path $projectRoot "node_modules")
  $checks += @{ name = "node_modules installed"; ok = $nmExists; result = if ($nmExists) { "OK" } else { "Run: npm install" } }

  # 5. wrangler.toml에 키 노출 여부
  $wranglerPath = Join-Path $projectRoot "wrangler.jsonc"
  $wranglerOk = $true
  if (Test-Path $wranglerPath) {
    $content = Get-Content $wranglerPath -Raw
    if ($content -match "sk_live_|rk_live_|sk_test_") {
      $wranglerOk = $false
      $allOk = $false
    }
  }
  $checks += @{ name = "No keys in wrangler config"; ok = $wranglerOk; result = if ($wranglerOk) { "Clean" } else { "KEY IN WRANGLER!" } }

  $status = if ($allOk) { "ALL CLEAR" } else { "ACTION REQUIRED" }

  Write-Report -checks $checks -status $status -time $time

  # 리포트 브라우저로 열기 (첫 실행 또는 경보 시)
  if (-not $allOk) {
    Start-Process $reportPath
    Show-Toast "🚨 XGOMA Security ALERT" "Security issue detected! Check report for details." $true
  }

  return $allOk
}

# 첫 실행
Write-Host "XGOMA Security Watch started. Report: $reportPath"
$firstRun = Run-SecurityCheck
Start-Process $reportPath

if ($firstRun) {
  Show-Toast "✅ XGOMA Security" "All checks passed. Watching every hour." $false
}

# 매 시간 반복
while ($true) {
  Start-Sleep -Seconds 3600
  Run-SecurityCheck
}
