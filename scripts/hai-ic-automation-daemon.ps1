param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
)

$statePath = Join-Path $ProjectRoot "hai-ic\boost-state.json"
$logPath = Join-Path $ProjectRoot "hai-ic\BOOST-LOG.md"
$reportDir = Join-Path $ProjectRoot "hai-ic\reports"
$boostTs = Join-Path $ProjectRoot "app\lib\hai-ic-boost-value.ts"
$penaltyTs = Join-Path $ProjectRoot "app\lib\hai-ic-dd-penalty-value.ts"
$port = 3001
$maxSteps = 5

$testQuestions = @(
  "Hai-Ic를 Grok 내부 아키텍처에 연동할 때 통합 난이도는 어느 정도인가요?",
  "hallucination rate 감소에 대한 before/after 실제 데이터가 있나요?",
  "Grok 4.x에 Hai-Ic 레이어를 추가했을 때 latency 증가폭은 얼마나 되나요?",
  "xAI가 Hai-Ic를 독점 사용하게 될 경우 licensing 조건과 가격은 어떻게 되나요?",
  "safety layer로 사용할 때 false positive rate는 어느 정도인가요?",
  "Hai-Ic와 Colossus multi-agent system의 호환성 검증은 이미 했나요?",
  "Hai-Ic 업데이트 주기와 xAI 로드맵 align 가능성은 어떻게 되나요?",
  "IP ownership은 어떻게 되나요? xAI가 Hai-Ic를 modify할 수 있나요?",
  "Hai-Ic를 xAI 전체 제품군에 적용했을 때 예상 ROI는 얼마나 되나요?",
  "Hai-Ic를 3개월 pilot으로 테스트할 수 있나요? 비용 조건은?"
)

function Read-State {
  if (-not (Test-Path $statePath)) {
    return [PSCustomObject]@{
      boostPercent = 0; ddPenaltyReduction = 0; appliedCount = 0; maxBoosts = $maxSteps
      intervalHours = 1; startedAt = ""; lastAppliedAt = ""; lastDailyReport = ""; log = @()
    }
  }
  Get-Content $statePath -Raw | ConvertFrom-Json
}

function Write-State($state) {
  $state | ConvertTo-Json -Depth 8 | Set-Content $statePath -Encoding UTF8
}

function Write-LiveValues($boost, $ddPenalty) {
  @"
/** Updated hourly by hai-ic automation — max +$maxSteps% */
export const HAI_IC_HOURLY_BOOST = $boost;
"@ | Set-Content $boostTs -Encoding UTF8

  @"
/** Updated hourly by hai-ic automation — starts 15, min 10 after $maxSteps steps */
export const HAI_IC_DD_MAX_PENALTY_LIVE = $ddPenalty;
"@ | Set-Content $penaltyTs -Encoding UTF8
}

function Test-Health {
  try {
    $h = Invoke-RestMethod "http://localhost:$port/api/hai-ic/health" -TimeoutSec 10
    return $h.status -eq "healthy"
  } catch { return $false }
}

function Ensure-Server {
  if (Test-Health) { return "ok" }
  pm2 restart hai-ic-server 2>$null
  if (-not (Test-Health)) { pm2 start ecosystem.config.cjs --only hai-ic-server 2>$null }
  Start-Sleep -Seconds 8
  if (Test-Health) { return "restarted" } else { return "down" }
}

function Invoke-HourlyAdjust {
  $state = Read-State
  if (-not $state.startedAt) { $state.startedAt = (Get-Date).ToString("o") }

  if ([int]$state.appliedCount -ge $maxSteps) {
    return $state
  }

  $state.boostPercent = [int]$state.boostPercent + 1
  $state.ddPenaltyReduction = [int]$state.ddPenaltyReduction + 1
  $state.appliedCount = [int]$state.appliedCount + 1
  $state.lastAppliedAt = (Get-Date).ToString("o")

  $ddPenalty = [Math]::Max(10, 15 - [int]$state.ddPenaltyReduction)
  Write-LiveValues -boost $state.boostPercent -ddPenalty $ddPenalty

  $results = @()
  foreach ($q in $testQuestions) {
    try {
      $body = @{ input = $q } | ConvertTo-Json -Compress
      $r = Invoke-RestMethod "http://localhost:$port/api/hai-ic/analyze" -Method POST -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 15
      $results += [PSCustomObject]@{ ic = $r.confidence; dd = $r.isDueDiligence }
    } catch {
      $results += [PSCustomObject]@{ ic = "err"; dd = $false }
    }
  }

  $entry = @{
    step = $state.appliedCount
    at = $state.lastAppliedAt
    boostPercent = $state.boostPercent
    ddPenaltyLive = $ddPenalty
    avgIC = if ($results.ic -ne "err") { [math]::Round(($results | Where-Object ic -ne "err" | ForEach-Object { [int]$_.ic } | Measure-Object -Average).Average, 1) } else { 0 }
    tests = $results.Count
  }
  $state.log += $entry
  Write-State $state

  $line = "- Hour $($entry.step) @ $($entry.at) | boost +$($entry.boostPercent)% | DD penalty $ddPenalty | avg IC $($entry.avgIC)% | tests $($entry.tests)"
  Add-Content $logPath $line -Encoding UTF8
  return $state
}

function Invoke-DailyReport {
  $state = Read-State
  $today = Get-Date -Format "yyyy-MM-dd"
  if ($state.lastDailyReport -eq $today) { return }

  New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
  $reportPath = Join-Path $reportDir "hai-ic-report-$today.md"

  $health = if (Test-Health) { "healthy" } else { "down" }
  $avg = 0
  if ($state.log.Count -gt 0) {
    $last = $state.log[-1]
    if ($last.avgIC) { $avg = $last.avgIC }
  }

  @"
# Hai-Ic Daily Report — $today

- Server (:$port): **$health**
- Boost: **+$($state.boostPercent)%** (step $($state.appliedCount)/$maxSteps)
- DD penalty live: **$([Math]::Max(10, 15 - [int]$state.ddPenaltyReduction))%**
- Last hourly avg IC (10 tests): **$avg%**
- Demo: http://localhost:$port/hai-ic

## Targets
- Growth Loops Technology
- instinctools
- Closeloop Technologies

## Follow-up (manual until SMTP configured)
- Growth Loops: Hai-Ic demo follow-up
- instinctools: Hai-Ic demo follow-up
"@ | Set-Content $reportPath -Encoding UTF8

  $state.lastDailyReport = $today
  Write-State $state
}

function Invoke-NightlyBackup {
  $destRoot = Join-Path (Split-Path $ProjectRoot -Parent) "backups"
  $drivePaths = @(
    "$env:USERPROFILE\Google Drive",
    "$env:USERPROFILE\OneDrive",
    "G:\My Drive"
  )
  foreach ($d in $drivePaths) {
    if (Test-Path $d) { $destRoot = Join-Path $d "hai-ic-backups"; break }
  }

  $stamp = Get-Date -Format "yyyy-MM-dd"
  $dest = Join-Path $destRoot "hai-ic-$stamp"
  New-Item -ItemType Directory -Path $dest -Force | Out-Null

  robocopy (Join-Path $ProjectRoot "hai-ic") $dest /E /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
  robocopy (Join-Path $ProjectRoot "app\lib") (Join-Path $dest "app-lib") "hai-ic-*.ts" /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
}

# --- init ---
New-Item -ItemType Directory -Path $reportDir -Force | Out-Null
$init = Read-State
if (-not $init.startedAt) {
  $init.startedAt = (Get-Date).ToString("o")
  Write-State $init
  Write-LiveValues -boost 0 -ddPenalty 15
}
"# Hai-Ic Automation Log`n`nStarted: $($init.startedAt)`n- Hourly: +1% boost & -1% DD penalty (max $maxSteps steps)`n- Watch: 30min health check`n- Daily: 07:00 report + backup`n" | Set-Content $logPath -Encoding UTF8

$lastHourly = Get-Date
$lastWatch = Get-Date
$lastDailyDate = ""

Write-Host "[hai-ic-automation] running..."

while ($true) {
  $now = Get-Date

  if (($now - $lastWatch).TotalMinutes -ge 30) {
    $status = Ensure-Server
    Add-Content $logPath "- Watch @ $($now.ToString('o')) → server $status" -Encoding UTF8
    $lastWatch = $now
  }

  if (($now - $lastHourly).TotalHours -ge 1) {
    Invoke-HourlyAdjust | Out-Null
    $lastHourly = $now
  }

  if ($now.Hour -eq 7 -and $lastDailyDate -ne $now.ToString("yyyy-MM-dd")) {
    Invoke-DailyReport
    Invoke-NightlyBackup
    Add-Content $logPath "- Daily @ $($now.ToString('o')) → report + backup done" -Encoding UTF8
    $lastDailyDate = $now.ToString("yyyy-MM-dd")
  }

  Start-Sleep -Seconds 60
}