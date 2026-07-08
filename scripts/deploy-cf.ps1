# Deploy to Cloudflare using API token from .env.local (no wrangler login / no OAuth popup)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
. (Join-Path $root "scripts\lib\with-user-context.ps1")
Enter-ScriptWithUserContext -Strict
Set-Location $root

$parsed = @{}
$envFile = Join-Path $root ".env.local"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^#|^$') { return }
    if ($line -match '^([^=]+)=(.*)$') {
      $parsed[$matches[1].Trim()] = $matches[2].Trim()
    }
  }
}

$vaultScript = Join-Path $PSScriptRoot "lib\secrets-vault.ps1"
$vaultJson = & $vaultScript export-json 2>$null
$vaultSecrets = @{}
if ($vaultJson) {
  ($vaultJson | ConvertFrom-Json).PSObject.Properties | ForEach-Object {
    $vaultSecrets[$_.Name] = [string]$_.Value
  }
}

foreach ($cfKey in @('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID')) {
  $cfVal = $vaultSecrets[$cfKey]
  if (-not $cfVal) { $cfVal = $parsed[$cfKey] }
  if ($cfVal) { Set-Item -Path "env:$cfKey" -Value $cfVal }
}

if (-not $env:CLOUDFLARE_API_TOKEN -or -not $env:CLOUDFLARE_ACCOUNT_ID) {
  Write-Host @"

Missing Cloudflare credentials (vault or .env.local)

1. Open https://dash.cloudflare.com/profile/api-tokens
2. Create Token -> template "Edit Cloudflare Workers"
3. Copy token + Account ID (dash home -> right sidebar)
4. Store locally (do not paste in chat):
   .\scripts\vault.ps1 set CLOUDFLARE_API_TOKEN
   .\scripts\vault.ps1 set CLOUDFLARE_ACCOUNT_ID
   OR add to .env.local

GitHub deploy: repo Secrets + Run workflow (see hai-ic/hiring/GITHUB-SECRETS-STEPS.txt)

Then run: npm run deploy:cf

"@
  exit 1
}

Write-Host "Syncing Workers secrets from secrets/hai-verify.env..."
powershell -ExecutionPolicy Bypass -File ./scripts/sync-workers-env.ps1
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Deploying with API token (no browser login)..."
npm run deploy
