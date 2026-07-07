# HAI Verify — DPAPI secrets vault CLI
# Usage:
#   .\scripts\vault.ps1 status
#   .\scripts\vault.ps1 migrate          # move plaintext keys → encrypted vault
#   .\scripts\vault.ps1 list
#   .\scripts\vault.ps1 set OPENAI_API_KEY "sk-proj-..."

param(
  [Parameter(Position = 0)]
  [string]$Command = "status",

  [Parameter(Position = 1)]
  [string]$Key,

  [Parameter(Position = 2)]
  [string]$Value
)

$vaultScript = Join-Path $PSScriptRoot "lib\secrets-vault.ps1"
& $vaultScript @PSBoundParameters