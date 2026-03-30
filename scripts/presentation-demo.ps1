param(
    [switch]$RunLocalApp,
    [int]$Port = 3000
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Invoke-Endpoint {
    param([string]$Url)
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 10
        Write-Host "[$($response.StatusCode)] $Url" -ForegroundColor Green
        if ($response.Content.Length -gt 400) {
            $response.Content.Substring(0, 400) + "..."
        } else {
            $response.Content
        }
    } catch {
        Write-Host "[FAIL] $Url" -ForegroundColor Red
        throw
    }
}

function Resolve-Tool {
    param([string[]]$Candidates)

    foreach ($candidate in $Candidates) {
        $command = Get-Command $candidate -ErrorAction SilentlyContinue
        if ($null -ne $command) {
            return $command.Source
        }
    }

    return $null
}

Write-Step "DevSecOps presentation helper"
Write-Host "Repo: M4K-Pipeline-main-main"
Write-Host "Port: $Port"

$npmCommand = Resolve-Tool -Candidates @("npm", "npm.cmd")
$nodeCommand = Resolve-Tool -Candidates @("node", "node.exe")

if ($null -eq $npmCommand) {
    throw "npm was not found on PATH. Install Node.js or open a terminal where npm is available."
}

if ($RunLocalApp -and $null -eq $nodeCommand) {
    throw "node was not found on PATH. Install Node.js or open a terminal where node is available."
}

Write-Step "1. Running automated tests"
& $npmCommand test
if ($LASTEXITCODE -ne 0) {
    throw "npm test failed."
}

Write-Step "2. Suggested container and Kubernetes commands"
Write-Host "docker build -t m4k-pipeline:demo ."
Write-Host "./scripts/deploy.sh demo"
Write-Host "kubectl get all -n boiler-room"
Write-Host "kubectl rollout status deployment/first-pipeline -n boiler-room"
Write-Host "kubectl port-forward service/first-pipeline $Port:3000 -n boiler-room"

if (-not $RunLocalApp) {
    Write-Step "Done"
    Write-Host "Run again with -RunLocalApp to start the app and verify endpoints automatically."
    exit 0
}

Write-Step "3. Starting local app"
$process = Start-Process -FilePath $nodeCommand -ArgumentList "index.js" -PassThru -WindowStyle Hidden

try {
    Start-Sleep -Seconds 2

    Write-Step "4. Verifying runtime endpoints"
    Invoke-Endpoint -Url "http://localhost:$Port/health"
    Invoke-Endpoint -Url "http://localhost:$Port/metrics"
    Invoke-Endpoint -Url "http://localhost:$Port/metrics/prometheus"

    Write-Step "Done"
    Write-Host "Local demo verification completed successfully." -ForegroundColor Green
}
finally {
    if ($null -ne $process -and -not $process.HasExited) {
        Stop-Process -Id $process.Id -Force
    }
}
