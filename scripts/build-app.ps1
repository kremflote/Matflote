$ErrorActionPreference = "Stop"

$root = Resolve-Path (Join-Path $PSScriptRoot "..")

& (Join-Path $PSScriptRoot "deploy-frontend.ps1")

Push-Location $root
try {
    & dotnet build backend -c Release --no-restore
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet build failed with exit code $LASTEXITCODE."
    }
} finally {
    Pop-Location
}

Write-Host "Flote app build completed."
