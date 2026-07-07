# US phone area codes: contact metadata only — never infer residence or USER_TIMEZONE.

$script:AreaCodeHints = @(
  @{ Codes = @('212','646','917','617','718','202','305'); Label = 'US Eastern (sample)'; Timezone = 'Eastern Standard Time' }
  @{ Codes = @('312','214','713','512'); Label = 'US Central (sample)'; Timezone = 'Central Standard Time' }
  @{ Codes = @('303','602','505'); Label = 'US Mountain (sample)'; Timezone = 'Mountain Standard Time' }
  @{ Codes = @('213','310','415','206','503'); Label = 'US Pacific (sample)'; Timezone = 'Pacific Standard Time' }
)

function Get-UsAreaCodeFromPhone {
  param([string]$Phone)
  $digits = -join ($Phone.ToCharArray() | Where-Object { $_ -match '\d' })
  if ($digits.Length -eq 11 -and $digits.StartsWith('1')) { return $digits.Substring(1, 3) }
  if ($digits.Length -eq 10) { return $digits.Substring(0, 3) }
  return $null
}

function Get-AreaCodeZoneHint {
  param([string]$Phone)
  $code = Get-UsAreaCodeFromPhone -Phone $Phone
  if (-not $code) { return $null }
  foreach ($entry in $script:AreaCodeHints) {
    if ($entry.Codes -contains $code) {
      return @{ Label = $entry.Label; Timezone = $entry.Timezone; AreaCode = $code }
    }
  }
  return @{ Label = "US area $code"; Timezone = $null; AreaCode = $code }
}