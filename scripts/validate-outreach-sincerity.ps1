$root = Split-Path -Parent $PSScriptRoot

function Get-SendableFiles {
  $files = @()
  $outreach = Join-Path $root "hai-ic\outreach"
  $buyer = Join-Path $root "hai-ic\buyer-deliverables"

  $pitch = Join-Path $outreach "PITCH-EMAIL-FINAL.txt"
  if (Test-Path $pitch) { $files += Get-Item $pitch }

  if (Test-Path $outreach) {
    $files += Get-ChildItem $outreach -Recurse -File | Where-Object {
      $_.Name -eq "EMAIL-TO-SEND.txt" -or $_.FullName -match "\\send-pack\\"
    }
  }

  if (Test-Path $buyer) {
    $files += Get-ChildItem $buyer -File -Filter "*.md"
  }

  $files | Select-Object -Unique FullName
}

$rules = @(
  @{ Pattern = "localhost|127\.0\.0\.1"; Reason = "localhost link" },
  @{ Pattern = "70\s*%|70%"; Reason = "unverified 70% claim" },
  @{ Pattern = "리스크 제로|zero risk|risk-free"; Reason = "overclaim" },
  @{ Pattern = "Production Ready"; Reason = "not honest for MVP" },
  @{ Pattern = "(?<![0-9])85%|≥85|>=85"; Reason = "wrong threshold (use 75%)" },
  @{ Pattern = "significantly reduce"; Reason = "unverified claim" },
  @{ Pattern = "artificial boost|score inflation|\+1% boost"; Reason = "score inflation" },
  @{ Pattern = "vaporware"; Reason = "defensive marketing tone" }
)

$errors = @()
foreach ($item in Get-SendableFiles) {
  $content = Get-Content $item.FullName -Raw -ErrorAction SilentlyContinue
  if (-not $content) { continue }
  $rel = $item.FullName.Replace($root + "\", "")
  foreach ($rule in $rules) {
    if ($content -match $rule.Pattern) {
      $errors += [PSCustomObject]@{ File = $rel; Rule = $rule.Reason }
    }
  }
}

if ($errors.Count -gt 0) {
  Write-Host ""
  Write-Host "BLOCKED — sincerity check failed:" -ForegroundColor Red
  $errors | Sort-Object File, Rule | ForEach-Object { Write-Host "  [$($_.Rule)] $($_.File)" }
  exit 1
}

Write-Host "OK — outreach passes sincerity validation"
exit 0