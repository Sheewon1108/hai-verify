# ONE person only — follow-up pitch. No new products. No infra.
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/send-one-followup.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$to = "gunendu@growthloopstechnology.com"
$name = "Growth Loops"
$subject = "Re: Hai-Ic — 30-min intent confidence demo (Growth Loops)"

$body = @"
Dear $name Team,

Following up on my note from July 7 — Hai-Ic (Intent Confidence Gate before your LLM / multi-agent stack).

One concrete offer:
- 2-week POC on your pipeline
- We only answer in full when intent confidence is 75%+
- Pilot terms: scoped in the call (no link in email)

Are you open to 30 minutes this week or next? I will walk through a live example on your use case.

Best regards,
KARAM SHIN
Founder, Hai-Ic
jay.transtar.inc@gmail.com
"@

node (Join-Path $root "scripts\validate-outreach-sincerity.cjs") 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Blocked by sincerity check — fix outreach copy first."
  exit 1
}

$outDir = Join-Path $root "hai-ic\outreach\growth-loops"
New-Item -ItemType Directory -Path $outDir -Force | Out-Null
$body | Set-Content (Join-Path $outDir "FOLLOWUP-EMAIL.txt") -Encoding UTF8
$to | Set-Content (Join-Path $outDir "TO.txt") -Encoding UTF8

$encSubject = [uri]::EscapeDataString($subject)
$encBody = [uri]::EscapeDataString($body)
$url = "https://mail.google.com/mail/?view=cm&fs=1&to=$to&su=$encSubject&body=$encBody"

Write-Host "ONE recipient: $name <$to>"
Write-Host "Opening Gmail draft (attach send-pack if first send; follow-up usually no attach)"
Start-Process $url

Write-Host ""
Write-Host "After you click Send, say: 보냄"