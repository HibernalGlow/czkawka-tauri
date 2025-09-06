# Set up vcpkg/pkg-config environment for this project and run the original run-tauri.ts
# This script is safe to run multiple times. It only affects the current process and child processes.

# Resolve vcpkg installation path (customize if your vcpkg is elsewhere)
$VcpkgRoot = 'D:\scoop\apps\vcpkg\current'
$PkgCfg1 = Join-Path $VcpkgRoot 'installed\x64-windows\lib\pkgconfig'
$PkgCfg2 = Join-Path $VcpkgRoot 'installed\x64-windows\debug\lib\pkgconfig'

# Append to existing PKG_CONFIG_PATH for this session
if ([string]::IsNullOrEmpty($env:PKG_CONFIG_PATH)) {
    $env:PKG_CONFIG_PATH = "$PkgCfg1;$PkgCfg2"
} else {
    $env:PKG_CONFIG_PATH = "$PkgCfg1;$PkgCfg2;$env:PKG_CONFIG_PATH"
}

# Helpful flags for pkg-config
$env:PKG_CONFIG_ALLOW_SYSTEM_CFLAGS = '1'

# Export VCPKG_ROOT for tools that check it
$env:VCPKG_ROOT = $VcpkgRoot

Write-Host "PKG_CONFIG_PATH set to: $env:PKG_CONFIG_PATH"
Write-Host "VCPKG_ROOT set to: $env:VCPKG_ROOT"

# Change to repository root (script may be run from repository root already)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Push-Location $scriptDir\..

# Run original tsx script with current environment
Write-Host "Starting original run-tauri script..."
try {
    tsx ./scripts/run-tauri.ts
} finally {
    Pop-Location
}
