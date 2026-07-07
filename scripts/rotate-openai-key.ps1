# OpenAI API key rotation — updates DPAPI vault (not plaintext env files)
# Usage: powershell -ExecutionPolicy Bypass -File ./scripts/rotate-openai-key.ps1 -NewKey "sk-proj-..."

param(
  [Parameter(Mandatory = $true)]
  [string]$NewKey
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
. (Join-Path $root "scripts\lib\with-user-context.ps1")
Enter-ScriptWithUserContext -Strict
$vaultScript = Join-Path $PSScriptRoot "lib\secrets-vault.ps1"

if ($NewKey -notmatch '^sk-') {
  Write-Host "Invalid key format. Must start with sk-"
  exit 1
}

# Verify new key works
$headers = @{ Authorization = "Bearer $NewKey" }
try {
  $null = Invoke-RestMethod -Uri "https://api.openai.com/v1/models" -Headers $headers -TimeoutSec 15
  Write-Host "New key verified OK"
} catch {
  Write-Host "New key verification FAILED:" $_.Exception.Message
  exit 1
}

& $vaultScript set OPENAI_API_KEY $NewKey
Write-Host "Updated OPENAI_API_KEY in DPAPI vault"

# Regenerate .dev.vars if sync script exists
$sync = Join-Path (Split-Path $PSScriptRoot -Parent) "scripts\sync-workers-env.ps1"
if (Test-Path $sync) {
  & $sync | Out-Null
  Write-Host "Regenerated .dev.vars"
}

Write-Host ""
Write-Host "Done. NEXT: revoke old key at https://platform.openai.com/api-keys"
Write-Host "Then restart: pm2 restart hai-ic-server"