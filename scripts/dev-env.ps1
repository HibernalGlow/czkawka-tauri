param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Command
)

# Set up a local dav1d/pkg-config environment for this project.
# Default command: tsx ./scripts/run-tauri.ts

$ErrorActionPreference = 'Stop'

function Merge-PathEntries {
    param([string[]]$Entries)

    $seen = @{}
    $result = @()

    foreach ($entry in $Entries) {
        if ([string]::IsNullOrWhiteSpace($entry)) {
            continue
        }

        $trimmed = $entry.Trim()
        $key = $trimmed.ToLowerInvariant()
        if (-not $seen.ContainsKey($key)) {
            $seen[$key] = $true
            $result += $trimmed
        }
    }

    return $result
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = (Resolve-Path (Join-Path $scriptDir '..')).Path

$localDav1dRoot = Join-Path $repoRoot '.local\dav1d'
$localPkgConfig = Join-Path $localDav1dRoot 'lib\pkgconfig'
$localPc = Join-Path $localPkgConfig 'dav1d.pc'
$localBin = Join-Path $localDav1dRoot 'bin'
$prebuiltZip = Join-Path $repoRoot 'prebuilt\dav1d-windows-x64.zip'

if (-not (Test-Path $localPc)) {
    if (-not (Test-Path $prebuiltZip)) {
        throw "Cannot find $localPc or $prebuiltZip"
    }

    Write-Host "Extracting prebuilt dav1d package..."
    if (Test-Path $localDav1dRoot) {
        Remove-Item -Recurse -Force $localDav1dRoot
    }
    New-Item -ItemType Directory -Path $localDav1dRoot -Force | Out-Null
    Expand-Archive -Path $prebuiltZip -DestinationPath $localDav1dRoot -Force
}

$pkgConfigEntries = @($localPkgConfig)
if (-not [string]::IsNullOrWhiteSpace($env:PKG_CONFIG_PATH)) {
    $pkgConfigEntries += ($env:PKG_CONFIG_PATH -split ';')
}
$env:PKG_CONFIG_PATH = (Merge-PathEntries -Entries $pkgConfigEntries) -join ';'
$env:PKG_CONFIG_ALLOW_SYSTEM_CFLAGS = '1'

$pathEntries = @($localBin)
if (-not [string]::IsNullOrWhiteSpace($env:PATH)) {
    $pathEntries += ($env:PATH -split ';')
}
$env:PATH = (Merge-PathEntries -Entries $pathEntries) -join ';'

Write-Host "PKG_CONFIG_PATH set to: $env:PKG_CONFIG_PATH"
Write-Host "PATH prefixed with: $localBin"

if (-not $Command -or $Command.Count -eq 0) {
    $Command = @('tsx', './scripts/run-tauri.ts')
}

Push-Location $repoRoot
try {
    Write-Host "Running: $($Command -join ' ')"
    & $Command[0] @($Command | Select-Object -Skip 1)
    if ($LASTEXITCODE -is [int] -and $LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
