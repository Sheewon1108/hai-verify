# Windows DPAPI secrets vault — keys encrypted per Windows user account.
# Vault file: ~/secrets/vault.dat (never commit)

param(
  [Parameter(Position = 0)]
  [ValidateSet("export-json", "list", "get", "set", "remove", "migrate", "status")]
  [string]$Command = "status",

  [Parameter(Position = 1)]
  [string]$Key,

  [Parameter(Position = 2)]
  [string]$Value
)

$ErrorActionPreference = "Stop"

$VaultPath = Join-Path $env:USERPROFILE "secrets\vault.dat"
$VaultMetaPath = Join-Path $env:USERPROFILE "secrets\vault.meta.json"

$SensitiveKeys = @(
  "OPENAI_API_KEY",
  "HAI_API_KEY_SECRET",
  "HAI_INTERNAL_API_KEY",
  "CORE_CRYPTO_KEY",
  "DISCORD_TOKEN",
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_STARTER",
  "STRIPE_PRICE_PRO",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
)

function Protect-Bytes([byte[]]$PlainBytes) {
  Add-Type -AssemblyName System.Security
  return [System.Security.Cryptography.ProtectedData]::Protect(
    $PlainBytes,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
}

function Unprotect-Bytes([byte[]]$EncryptedBytes) {
  Add-Type -AssemblyName System.Security
  return [System.Security.Cryptography.ProtectedData]::Unprotect(
    $EncryptedBytes,
    $null,
    [System.Security.Cryptography.DataProtectionScope]::CurrentUser
  )
}

function Read-Vault {
  if (-not (Test-Path $VaultPath)) {
    return @{}
  }
  $b64 = Get-Content $VaultPath -Raw
  if ([string]::IsNullOrWhiteSpace($b64)) {
    return @{}
  }
  $encrypted = [Convert]::FromBase64String($b64.Trim())
  $plain = Unprotect-Bytes $encrypted
  $json = [System.Text.Encoding]::UTF8.GetString($plain)
  $obj = $json | ConvertFrom-Json
  $map = @{}
  $obj.PSObject.Properties | ForEach-Object { $map[$_.Name] = [string]$_.Value }
  return $map
}

function Write-Vault([hashtable]$Secrets) {
  $dir = Split-Path $VaultPath -Parent
  if (-not (Test-Path $dir)) {
    New-Item -ItemType Directory -Path $dir -Force | Out-Null
  }
  $ordered = [ordered]@{}
  $Secrets.GetEnumerator() | Sort-Object Name | ForEach-Object { $ordered[$_.Key] = $_.Value }
  $json = $ordered | ConvertTo-Json -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
  $protected = Protect-Bytes $bytes
  [Convert]::ToBase64String($protected) | Set-Content $VaultPath -Encoding ASCII -NoNewline

  $meta = @{
    version     = 1
    updatedAt   = (Get-Date).ToString("o")
    keyCount    = $Secrets.Count
    keys        = @($Secrets.Keys | Sort-Object)
    protection  = "DPAPI-CurrentUser"
    machine     = $env:COMPUTERNAME
  }
  $meta | ConvertTo-Json | Set-Content $VaultMetaPath -Encoding UTF8
}

function Parse-EnvFile([string]$Path) {
  $parsed = @{}
  if (-not (Test-Path $Path)) { return $parsed }
  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -match '^#|^$') { return }
    if ($line -match '^([^=]+)=(.*)$') {
      $parsed[$matches[1].Trim()] = $matches[2].Trim()
    }
  }
  return $parsed
}

function Strip-SecretsFromEnvFile([string]$Path, [string[]]$KeysInVault) {
  if (-not (Test-Path $Path)) { return }
  $lines = Get-Content $Path
  $out = @()
  foreach ($line in $lines) {
    if ($line -match '^([^=]+)=(.*)$') {
      $name = $matches[1].Trim()
      if ($KeysInVault -contains $name -or $SensitiveKeys -contains $name) {
        if ($out[-1] -ne "# Stored in DPAPI vault (~/secrets/vault.dat)") {
          $out += "# Stored in DPAPI vault (~/secrets/vault.dat)"
        }
        continue
      }
    }
    $out += $line
  }
  $out | Set-Content $Path -Encoding UTF8
}

switch ($Command) {
  "export-json" {
    $vault = Read-Vault
    $vault | ConvertTo-Json -Compress
  }
  "list" {
    $vault = Read-Vault
    if ($vault.Count -eq 0) {
      Write-Host "Vault empty or missing: $VaultPath"
      exit 1
    }
    $vault.Keys | Sort-Object | ForEach-Object {
      $name = $_
      $v = $vault[$name]
      $masked = if ($v.Length -gt 8) {
        $v.Substring(0, 4) + "..." + $v.Substring($v.Length - 4)
      } else {
        "****"
      }
      Write-Host "${name} = ${masked}"
    }
  }
  "get" {
    if (-not $Key) { Write-Error "Usage: secrets-vault.ps1 get KEY"; exit 1 }
    $vault = Read-Vault
    if (-not $vault.ContainsKey($Key)) { exit 1 }
    Write-Output $vault[$Key]
  }
  "set" {
    if (-not $Key -or -not $Value) { Write-Error "Usage: secrets-vault.ps1 set KEY VALUE"; exit 1 }
    $vault = Read-Vault
    $vault[$Key] = $Value
    Write-Vault $vault
    Write-Host "Set $Key in vault ($VaultPath)"
  }
  "remove" {
    if (-not $Key) { Write-Error "Usage: secrets-vault.ps1 remove KEY"; exit 1 }
    $vault = Read-Vault
    if ($vault.ContainsKey($Key)) {
      $vault.Remove($Key) | Out-Null
      Write-Vault $vault
      Write-Host "Removed $Key from vault"
    }
  }
  "migrate" {
    $sources = @(
      (Join-Path $env:USERPROFILE "secrets\hai-verify.env"),
      (Join-Path $env:USERPROFILE "secrets\desktop.env"),
      (Join-Path $env:USERPROFILE "secrets\core-crypto.env"),
      (Join-Path $env:USERPROFILE "secrets\discord-bot.env")
    )
    $vault = Read-Vault
    $migrated = @()

    foreach ($src in $sources) {
      $parsed = Parse-EnvFile $src
      foreach ($name in $SensitiveKeys) {
        $val = $parsed[$name]
        if ($val -and $val -notmatch '\.\.\.|^<|your_|placeholder' -and $val.Length -gt 8) {
          $vault[$name] = $val
          if ($migrated -notcontains $name) { $migrated += $name }
        }
      }
    }

    if ($migrated.Count -eq 0) {
      Write-Host "Nothing to migrate — vault may already be populated or env files are empty."
      exit 0
    }

    Write-Vault $vault
    foreach ($src in $sources) {
      Strip-SecretsFromEnvFile $src $migrated
    }
    Write-Host "Migrated $($migrated.Count) key(s) to DPAPI vault:"
    $migrated | Sort-Object | ForEach-Object { Write-Host "  - $_" }
    Write-Host "Plaintext secrets removed from env files. Vault: $VaultPath"
  }
  "status" {
    $exists = Test-Path $VaultPath
    Write-Host "Vault path: $VaultPath"
    Write-Host "Exists: $exists"
    if ($exists) {
      try {
        $vault = Read-Vault
        Write-Host "Keys: $($vault.Count)"
        Write-Host "Protection: DPAPI (CurrentUser — only this Windows account can decrypt)"
      } catch {
        Write-Host "ERROR: Cannot decrypt vault - wrong user account?"
        exit 1
      }
    }
  }
}