# Deploy to Cloudflare using API token from .env.local (no wrangler login / no OAuth popup)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$envFile = Join-Path $root ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Host "Create .env.local from .env.example and set CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID"
  exit 1
}

Get-Content $envFile | ForEach-Object {
  $line = $_.Trim()
  if ($line -match '^#|^$') { return }
  if ($line -match '^([^=]+)=(.*)$') {
    $name = $matches[1].Trim()
    $value = $matches[2].Trim()
    if ($name -eq 'CLOUDFLARE_API_TOKEN' -or $name -eq 'CLOUDFLARE_ACCOUNT_ID') {
      Set-Item -Path "env:$name" -Value $value
    }
  }
}

if (-not $env:CLOUDFLARE_API_TOKEN -or -not $env:CLOUDFLARE_ACCOUNT_ID) {
  Write-Host @"

Missing Cloudflare credentials in .env.local

1. Open https://dash.cloudflare.com/profile/api-tokens
2. Create Token -> template "Edit Cloudflare Workers"
3. Copy token + Account ID (dash home -> right sidebar)
4. Add to .env.local:
   CLOUDFLARE_API_TOKEN=...
   CLOUDFLARE_ACCOUNT_ID=...

Then run: npm run deploy:cf

"@
  exit 1
}

Write-Host "Deploying with API token (no browser login)..."
npm run deploy
