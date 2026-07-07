param(
    [switch]$Install
)

$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontendPath = Join-Path $root "frontend"
$backendPath = Join-Path $root "backend"
$distPath = Join-Path $frontendPath "dist"
$wwwrootPath = Join-Path $backendPath "wwwroot"

if ($Install) {
    Push-Location $frontendPath
    try {
        & npm.cmd install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }
}

Push-Location $frontendPath
try {
    & npm.cmd run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}

New-Item -ItemType Directory -Path $wwwrootPath -Force | Out-Null

$preservedRootEntries = @("images")

Get-ChildItem -LiteralPath $wwwrootPath -Force | ForEach-Object {
    if ($preservedRootEntries -notcontains $_.Name) {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force
    }
}

Copy-Item -Path (Join-Path $distPath "*") -Destination $wwwrootPath -Recurse -Force

Write-Host "Frontend deployed to backend/wwwroot."
