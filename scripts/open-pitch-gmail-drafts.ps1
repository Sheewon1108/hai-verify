$root = Split-Path -Parent $PSScriptRoot
$outreach = Join-Path $root "hai-ic\outreach"
$subject = "Hai-Ic — Intent Confidence Layer for LLM & Multi-Agent Systems"

node (Join-Path $PSScriptRoot "validate-outreach-sincerity.cjs")
if ($LASTEXITCODE -ne 0) {
  Write-Host "Gmail drafts BLOCKED — fix sincerity issues first." -ForegroundColor Red
  exit 1
}

$targets = @(
  @{ Name = "Growth Loops"; To = "gunendu@growthloopstechnology.com"; Dir = "growth-loops" },
  @{ Name = "Closeloop"; To = "sales@closeloop.com"; Dir = "closeloop" },
  @{ Name = "instinctools"; To = "contact@instinctools.com"; Dir = "instinctools" }
)

foreach ($t in $targets) {
  $bodyPath = Join-Path $outreach "$($t.Dir)\EMAIL-TO-SEND.txt"
  if (-not (Test-Path $bodyPath)) {
    $bodyPath = Join-Path $outreach "PITCH-EMAIL-FINAL.txt"
  }
  $body = Get-Content $bodyPath -Raw
  $body = $body -replace "\{TEAM\}", $t.Name
  $encSubject = [uri]::EscapeDataString($subject)
  $encBody = [uri]::EscapeDataString($body)
  $url = "https://mail.google.com/mail/?view=cm&fs=1&to=$($t.To)&su=$encSubject&body=$encBody"
  Write-Host "Opening draft -> $($t.Name) <$($t.To)>"
  Start-Process $url
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "Attach from: hai-ic\outreach\send-pack\"
Write-Host "  BUYER-ONE-PAGER.md, TRUST-LEDGER.md, OFF-CASES.md"
Write-Host "Review each tab -> Send when ready. Say '보내' after sending."