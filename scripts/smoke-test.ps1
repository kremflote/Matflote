$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http

$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$frontendPath = Join-Path $root "frontend"
$backendPath = Join-Path $root "backend"
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("flote-smoke-" + [Guid]::NewGuid().ToString("N"))
$dataRoot = Join-Path $tempRoot "data"
$imagesRoot = Join-Path $tempRoot "images"
$logPath = Join-Path $tempRoot "backend.log"
$errorLogPath = Join-Path $tempRoot "backend.err.log"
$port = 5198
$baseUrl = "http://localhost:$port"
$process = $null

function Invoke-SmokeEndpoint {
    param(
        [string] $Path
    )

    Invoke-RestMethod -Uri "$baseUrl$Path" -Method Get | Out-Null
    Write-Host "OK $Path"
}

function Invoke-SmokeImageUpload {
    $imagePath = Join-Path $root "backend/SeedImages/recipes/chicken-rice-bowl.png"
    $client = [System.Net.Http.HttpClient]::new()
    $content = [System.Net.Http.MultipartFormDataContent]::new()
    $fileStream = [System.IO.File]::OpenRead($imagePath)

    try {
        $fileContent = [System.Net.Http.StreamContent]::new($fileStream)
        $fileContent.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("image/png")
        $content.Add($fileContent, "file", "chicken-rice-bowl.png")
        $content.Add([System.Net.Http.StringContent]::new("recipes"), "folder")

        $response = $client.PostAsync("$baseUrl/api/imageuploads", $content).GetAwaiter().GetResult()
        $response.EnsureSuccessStatusCode() | Out-Null
        $responseBody = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
        $upload = $responseBody | ConvertFrom-Json
        $storedRelativePath = $upload.url.TrimStart("/")
        if ($storedRelativePath.StartsWith("images/")) {
            $storedRelativePath = $storedRelativePath.Substring("images/".Length)
        }

        $storedRelativePath = $storedRelativePath -replace "/", [IO.Path]::DirectorySeparatorChar
        $storedPath = Join-Path $imagesRoot $storedRelativePath

        if (!(Test-Path -LiteralPath $storedPath)) {
            throw "Uploaded file was not stored at $storedPath."
        }

        Write-Host "OK image upload $($upload.url)"
    } finally {
        $fileStream.Dispose()
        $content.Dispose()
        $client.Dispose()
    }
}

try {
    New-Item -ItemType Directory -Path $dataRoot, $imagesRoot -Force | Out-Null

    Push-Location $frontendPath
    try {
        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) {
            throw "npm run build failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }

    Push-Location $root
    try {
        & dotnet build backend -c Release --no-restore
        if ($LASTEXITCODE -ne 0) {
            throw "dotnet build failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }

    $env:ASPNETCORE_ENVIRONMENT = "Production"
    $env:ConnectionStrings__DinnerPlanner = "Data Source=$dataRoot/dinnerplanner-smoke.db"
    $env:ImageStorage__RootPath = $imagesRoot

    $dllPath = Join-Path $backendPath "bin/Release/net9.0/backend.dll"
    $process = Start-Process `
        -FilePath "dotnet" `
        -ArgumentList @($dllPath, "--urls", $baseUrl) `
        -WorkingDirectory $backendPath `
        -WindowStyle Hidden `
        -RedirectStandardOutput $logPath `
        -RedirectStandardError $errorLogPath `
        -PassThru

    $deadline = (Get-Date).AddSeconds(20)
    do {
        try {
            Invoke-RestMethod -Uri "$baseUrl/health" -Method Get | Out-Null
            break
        } catch {
            Start-Sleep -Milliseconds 500
        }
    } while ((Get-Date) -lt $deadline)

    Invoke-SmokeEndpoint "/health"
    Invoke-SmokeEndpoint "/api/recipes"
    Invoke-SmokeEndpoint "/api/ingredients"
    Invoke-SmokeEndpoint "/api/mealplans?from=2026-01-01&to=2026-01-07"
    Invoke-SmokeImageUpload

    Write-Host "Smoke test completed."
} finally {
    if ($process -ne $null -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }

    Remove-Item Env:\ASPNETCORE_ENVIRONMENT -ErrorAction SilentlyContinue
    Remove-Item Env:\ConnectionStrings__DinnerPlanner -ErrorAction SilentlyContinue
    Remove-Item Env:\ImageStorage__RootPath -ErrorAction SilentlyContinue

    if (Test-Path $tempRoot) {
        Remove-Item -LiteralPath $tempRoot -Recurse -Force
    }
}
