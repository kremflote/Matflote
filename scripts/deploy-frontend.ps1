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
    npm install
    Pop-Location
}

Push-Location $frontendPath
npm run build
Pop-Location

New-Item -ItemType Directory -Path $wwwrootPath -Force | Out-Null

$generatedPaths = @(
    (Join-Path $wwwrootPath "assets"),
    (Join-Path $wwwrootPath "index.html"),
    (Join-Path $wwwrootPath "favicon.svg"),
    (Join-Path $wwwrootPath "icons.svg")
)

foreach ($path in $generatedPaths) {
    if (Test-Path $path) {
        Remove-Item -LiteralPath $path -Recurse -Force
    }
}

Copy-Item -Path (Join-Path $distPath "*") -Destination $wwwrootPath -Recurse -Force

Write-Host "Frontend deployed to backend/wwwroot."
