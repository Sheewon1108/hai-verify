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

  # 1. Stripe 라이브 키 코드 노출 검사
  $leakFiles = Get-ChildItem -Path $projectRoot -Recurse -Include "*.ts","*.js","*.json" |
    Where-Object { $_.FullName -notmatch "node_modules|\.next|\.example" } |
    Select-String -Pattern "sk_live_|rk_live_|pk_live_" -Quiet
  $ok1 = -not $leakFiles
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
  $checks += @{ name = ".env.local exists locally"; ok = $envExists; result = if ($envExists) { "Found" } else { "Missing — keys not set" } }

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
