$root = Split-Path -Parent $PSScriptRoot
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
function Write-Utf8NoBom([string]$Path, [string]$Content) {
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}
$outreach = Join-Path $root "hai-ic\outreach"
$buyerDir = Join-Path $root "hai-ic\buyer-deliverables"
$packRoot = Join-Path $outreach "send-pack"

New-Item -ItemType Directory -Path $packRoot -Force | Out-Null

$attach = @("BUYER-ONE-PAGER.md", "TRUST-LEDGER.md", "OFF-CASES.md")
foreach ($f in $attach) {
  Copy-Item (Join-Path $buyerDir $f) (Join-Path $packRoot $f) -Force
}
Copy-Item (Join-Path $outreach "PITCH-EMAIL-FINAL.txt") (Join-Path $packRoot "PITCH-EMAIL-FINAL.txt") -Force

$targets = @(
  @{
    Name = "Growth Loops"
    To = "gunendu@growthloopstechnology.com"
    Note = "Official contact page"
    Hook = "Why Growth Loops: Your multi-agent pipeline is where an Intent Confidence Gate pays off first - we hold uncertain intent before agents act."
  },
  @{
    Name = "Closeloop"
    To = "sales@closeloop.com"
    Note = "Sales — closeloop.com/contact"
    Hook = "Why Closeloop: Hai-Ic can sit at the first step of your automation workflows - uncertain intent gets clarifying questions, not a blind answer."
  },
  @{
    Name = "instinctools"
    To = "contact@instinctools.com"
    Note = "General contact — verify on instinctools.com if bounce"
    Hook = "Why instinctools: Hai-Ic is a drop-in pre-LLM gate for SDK and enterprise stacks — Intent Confidence % on every request."
  }
)

$ready = @"
# Hai-Ic Pitch — SEND READY

**From:** jay.transtar.inc@gmail.com (KARAM SHIN)
**Subject:** Hai-Ic — Intent Confidence Layer for LLM & Multi-Agent Systems
**Status:** APPROVED — 3 companies, Gmail drafts open, you click Send
**Decision:** KARAM + 형 — PRODUCT.md / Demo / all 3 targets
**Sincerity gate:** validate-outreach-sincerity.cjs

## Never in buyer email (auto-blocked)
- localhost / demo URL links
- significantly reduce (unverified)
- score inflation wording

## Attachments (send-pack/)
- BUYER-ONE-PAGER.md
- TRUST-LEDGER.md
- OFF-CASES.md

## Targets (send 3 separate emails — recommended)

"@

foreach ($t in $targets) {
  $dir = Join-Path $outreach ($t.Name.ToLower() -replace '\s','-')
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
  $body = (Get-Content (Join-Path $outreach "PITCH-EMAIL-FINAL.txt") -Raw -Encoding UTF8) -replace "\{TEAM\}", $t.Name
  if ($t.Hook) {
    $body = $body -replace "(We built this because teams do not trust AI that answers when it is not sure\.)", "`$1`n`n$($t.Hook)"
  }
  Write-Utf8NoBom (Join-Path $dir "EMAIL-TO-SEND.txt") $body
  Write-Utf8NoBom (Join-Path $dir "TO.txt") $t.To
  $targetPack = Join-Path $dir "send-pack"
  New-Item -ItemType Directory -Path $targetPack -Force | Out-Null
  foreach ($f in $attach) {
    Copy-Item (Join-Path $packRoot $f) (Join-Path $targetPack $f) -Force
  }
  $ready += "`n### $($t.Name)`n- **To:** $($t.To)`n- **Folder:** hai-ic/outreach/$($t.Name.ToLower() -replace '\s','-')/`n- **Note:** $($t.Note)`n"
}

Write-Utf8NoBom (Join-Path $outreach "SEND-READY.md") $ready

Write-Host ""
Write-Host "=== PITCH SEND PACK READY ===" -ForegroundColor Green
Write-Host "Subject: Hai-Ic — Intent Confidence Layer for LLM & Multi-Agent Systems"
Write-Host "Pack:    $packRoot"
Write-Host "Guide:   hai-ic\outreach\SEND-READY.md"
Write-Host ""
Write-Host "Open Gmail drafts:"
Write-Host "  powershell -File scripts\open-pitch-gmail-drafts.ps1"
Write-Host ""
Write-Host "Review tabs -> attach 3 files -> Send (3 separate emails)"
Write-Host ""

node (Join-Path $PSScriptRoot "validate-outreach-sincerity.cjs")
if ($LASTEXITCODE -ne 0) { exit 1 }

explorer $packRoot
explorer (Join-Path $outreach "SEND-READY.md")