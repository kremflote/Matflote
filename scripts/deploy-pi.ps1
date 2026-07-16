param(
    [string]$HostName = "kremflote@krem-pi",
    [string]$InfraPath = "~/infra",
    [string]$RepoPath = "~/infra/matflote",
    [ValidateSet("all", "backend", "frontend")]
    [string]$Target = "all",
    [switch]$SkipPull,
    [switch]$NoBuild,
    [switch]$DryRun,
    [switch]$PauseOnExit,
    [string]$LogPath = (Join-Path $PSScriptRoot "deploy-pi.last.log")
)

$ErrorActionPreference = "Stop"

$services = switch ($Target) {
    "backend" { "matflote-backend" }
    "frontend" { "matflote-frontend" }
    default { "matflote-backend matflote-frontend" }
}

$commands = New-Object System.Collections.Generic.List[string]
$commands.Add("set -e")
$commands.Add("cd $RepoPath")

if (-not $SkipPull) {
    $commands.Add("git pull --ff-only")
}

$commands.Add("cd $InfraPath")

if ($NoBuild) {
    $commands.Add("docker compose up -d $services")
} else {
    $commands.Add("docker compose up -d --build $services")
}

$commands.Add("docker compose ps matflote-backend matflote-frontend")

if ($Target -ne "frontend") {
    $commands.Add("docker exec matflote-backend sh -c 'test -f /app/SeedImages/placeholders/recipe-photo-placeholder.png && echo OK packaged placeholder image || (echo MISSING packaged placeholder image; exit 1)'")
    $commands.Add("docker exec matflote-backend sh -c 'test -f /data/images/placeholders/recipe-photo-placeholder.png && echo OK seeded placeholder image || (echo MISSING seeded placeholder image; ls -la /app/SeedImages/placeholders /data/images/placeholders 2>/dev/null || true; exit 1)'")
    $commands.Add("docker exec matflote-frontend sh -c 'for attempt in `$(seq 1 30); do wget -q --spider http://backend:8080/health && echo OK backend health URL && exit 0; sleep 1; done; echo MISSING backend health URL; exit 1'")
    $commands.Add("docker exec matflote-frontend sh -c 'wget -q --spider http://backend:8080/images/placeholders/recipe-photo-placeholder.png && echo OK backend serves placeholder image URL || (echo MISSING backend placeholder image URL; exit 1)'")
    $commands.Add("docker exec matflote-frontend sh -c 'wget -q --spider http://localhost/images/placeholders/recipe-photo-placeholder.png && echo OK frontend proxies placeholder image URL || (echo MISSING frontend placeholder image URL; exit 1)'")
}

$remoteCommand = $commands -join " && "
$sshArguments = @($HostName, $remoteCommand)

Write-Host "Deploy target: $Target"
Write-Host "Remote host:   $HostName"
Write-Host "Remote repo:   $RepoPath"
Write-Host "Compose path:  $InfraPath"
Write-Host "Log file:      $LogPath"
Write-Host ""
Write-Host "Remote command:"
Write-Host $remoteCommand
Write-Host ""

if ($DryRun) {
    Write-Host "Dry run only. No remote command was executed."
    if ($PauseOnExit) {
        Read-Host "Press Enter to close"
    }
    exit 0
}

Set-Content -Path $LogPath -Value @(
    "Deploy target: $Target"
    "Remote host:   $HostName"
    "Remote repo:   $RepoPath"
    "Compose path:  $InfraPath"
    ""
    "Remote command:"
    $remoteCommand
    ""
)

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = "Continue"

try {
    & ssh @sshArguments 2>&1 | Tee-Object -FilePath $LogPath -Append
    $exitCode = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $previousErrorActionPreference
}

Add-Content -Path $LogPath -Value ""
Add-Content -Path $LogPath -Value "Exit code: $exitCode"

Write-Host ""
Write-Host "Deploy log written to: $LogPath"

if ($PauseOnExit) {
    Read-Host "Press Enter to close"
}

exit $exitCode
