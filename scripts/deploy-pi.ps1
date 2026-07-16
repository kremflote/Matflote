param(
    [string]$HostName = "kremflote@krem-pi",
    [string]$InfraPath = "~/infra",
    [string]$RepoPath = "~/infra/matflote",
    [ValidateSet("all", "backend", "frontend")]
    [string]$Target = "all",
    [switch]$SkipPull,
    [switch]$NoBuild,
    [switch]$DryRun
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
    $commands.Add("docker compose exec -T matflote-backend sh -c 'test -f /app/SeedImages/placeholders/recipe-photo-placeholder.png && echo OK packaged placeholder image || (echo MISSING packaged placeholder image; exit 1)'")
    $commands.Add("docker compose exec -T matflote-backend sh -c 'test -f /data/images/placeholders/recipe-photo-placeholder.png && echo OK seeded placeholder image || (echo MISSING seeded placeholder image; ls -la /app/SeedImages/placeholders /data/images/placeholders 2>/dev/null || true; exit 1)'")
}

$remoteCommand = $commands -join " && "
$sshArguments = @($HostName, $remoteCommand)

Write-Host "Deploy target: $Target"
Write-Host "Remote host:   $HostName"
Write-Host "Remote repo:   $RepoPath"
Write-Host "Compose path:  $InfraPath"
Write-Host ""
Write-Host "Remote command:"
Write-Host $remoteCommand
Write-Host ""

if ($DryRun) {
    Write-Host "Dry run only. No remote command was executed."
    exit 0
}

ssh @sshArguments
