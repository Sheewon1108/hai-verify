# Dot-source at top of operational scripts:
#   $ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
#   . (Join-Path $ProjectRoot "scripts\lib\with-user-context.ps1")
#   Enter-ScriptWithUserContext

$WithUserContextLibRoot = $PSScriptRoot

function Enter-ScriptWithUserContext {
  param([switch]$Strict)
  . (Join-Path $WithUserContextLibRoot "user-context.ps1")
  if ($Strict) {
    $null = Assert-UserContext -Strict
  } else {
    $null = Assert-UserContext
  }
}