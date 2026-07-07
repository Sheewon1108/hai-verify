# CLI: verify Windows timezone vs user config. Used by PS + Node entry points.
$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "user-context.ps1")
$ok = Assert-UserContext -Strict
if (-not $ok) { exit 1 }
exit 0