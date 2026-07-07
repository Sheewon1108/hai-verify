param(
  [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path,
  [int]$MaxBoosts = 5,
  [int]$IntervalSeconds = 3600
)

$statePath = Join-Path $ProjectRoot "hai-ic\boost-state.json"
$logPath = Join-Path $ProjectRoot "hai-ic\BOOST-LOG.md"
$sampleQuestion = "hallucination rate 감소에 대한 before/after 실제 데이터가 있나요?"

function Read-State {
  Get-Content $statePath -Raw | ConvertFrom-Json
}

function Write-State($state) {
  $state | ConvertTo-Json -Depth 6 | Set-Content $statePath -Encoding UTF8
}

function Test-SampleIc {
  try {
    $body = @{ input = $sampleQuestion } | ConvertTo-Json -Compress
    $r = Invoke-RestMethod "http://localhost:3001/api/hai-ic/analyze" -Method POST -Body $body -ContentType "application/json; charset=utf-8" -TimeoutSec 20
    return @{ ok = $true; confidence = $r.confidence; mode = $r.mode }
  } catch {
    return @{ ok = $false; error = $_.Exception.Message }
  }
}

$state = Read-State
if (-not $state.startedAt) {
  $state.startedAt = (Get-Date).ToString("o")
}
Write-State $state

"# Hai-ic Hourly Boost Log`n`nStarted: $($state.startedAt)`nMax: +$MaxBoosts% (1% per hour)`n" | Set-Content $logPath -Encoding UTF8

for ($i = 1; $i -le $MaxBoosts; $i++) {
  Start-Sleep -Seconds $IntervalSeconds

  $state = Read-State
  if ($state.appliedCount -ge $MaxBoosts) { break }

  $state.boostPercent = [int]$state.boostPercent + 1
  $state.appliedCount = [int]$state.appliedCount + 1
  $state.lastAppliedAt = (Get-Date).ToString("o")

  $boostTs = Join-Path $ProjectRoot "app\lib\hai-ic-boost-value.ts"
  @"
/** Updated hourly by scripts/hourly-confidence-boost.ps1 — max +$MaxBoosts% */
export const HAI_IC_HOURLY_BOOST = $($state.boostPercent);
"@ | Set-Content $boostTs -Encoding UTF8

  $sample = Test-SampleIc
  $entry = @{
    step = $state.appliedCount
    at = $state.lastAppliedAt
    boostPercent = $state.boostPercent
    sampleIC = if ($sample.ok) { "$($sample.confidence)%" } else { "server-down" }
    sampleMode = if ($sample.ok) { $sample.mode } else { $sample.error }
  }
  $state.log += $entry
  Write-State $state

  $line = "- Step $($entry.step) @ $($entry.at) → boost +$($entry.boostPercent)% | sample IC $($entry.sampleIC) ($($entry.sampleMode))"
  Add-Content $logPath $line -Encoding UTF8
}

$final = Read-State
$summary = @"

## Done
- Final boost: +$($final.boostPercent)%
- Applied: $($final.appliedCount) / $MaxBoosts
- Finished: $((Get-Date).ToString('o'))
- Check: http://localhost:3001/hai-ic
"@
Add-Content $logPath $summary -Encoding UTF8