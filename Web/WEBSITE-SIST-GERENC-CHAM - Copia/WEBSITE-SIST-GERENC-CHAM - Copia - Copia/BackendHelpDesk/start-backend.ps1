<#
.SYNOPSIS
    Start BackendHelpDesk API in Development mode, with safe port handling and logging.

.DESCRIPTION
    This script will stop any process listening on the configured port (default 5000),
    start the ASP.NET Core backend with ASPNETCORE_ENVIRONMENT=Development, redirect
    stdout/stderr to log files and write the started process PID to backend.pid.

.USAGE
    .\start-backend.ps1 [-Port 5000]
#>

param(
    [int]$Port = 5000
)

Set-StrictMode -Version Latest
Push-Location -Path $PSScriptRoot

function Stop-PortProcess {
    param([int]$Port)
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -Expand OwningProcess -Unique
            foreach ($pid in $pids) {
                try {
                    Write-Host "Stopping existing process PID $pid listening on port $Port..."
                    Stop-Process -Id $pid -Force -ErrorAction Stop
                    Write-Host "Stopped PID $pid"
                } catch {
                    Write-Warning "Failed to stop PID $pid`: $($_.Exception.Message)"
                }
            }
        } else {
            Write-Host "No process listening on port $Port"
        }
    } catch {
        Write-Warning "Warning while checking port: $($_.Exception.Message)"
    }
}

function Start-Backend {
    param([int]$Port)

    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $outLog = Join-Path $PSScriptRoot 'backend_out.log'
    $errLog = Join-Path $PSScriptRoot 'backend_err.log'
    $pidFile = Join-Path $PSScriptRoot 'backend.pid'

    # Ensure old logs exist
    if (-Not (Test-Path $outLog)) { New-Item -Path $outLog -ItemType File | Out-Null }
    if (-Not (Test-Path $errLog)) { New-Item -Path $errLog -ItemType File | Out-Null }

    Write-Host "Starting BackendHelpDesk on port $Port (Development)..."

    $startInfo = @{ FilePath = 'dotnet'; ArgumentList = @('run','--no-build'); WorkingDirectory = $PSScriptRoot; }

    # Start process with redirected streams
    $proc = Start-Process -FilePath $startInfo.FilePath -ArgumentList $startInfo.ArgumentList -WorkingDirectory $startInfo.WorkingDirectory -RedirectStandardOutput $outLog -RedirectStandardError $errLog -PassThru

    if ($proc) {
        Write-Host "Backend started (PID: $($proc.Id)). Logs: $outLog, $errLog"
        try {
            Set-Content -Path $pidFile -Value $proc.Id -Encoding ASCII
        } catch {
            Write-Warning "Could not write PID file: $($_.Exception.Message)"
        }
    } else {
        Write-Error "Failed to start backend process. See logs for details."
    }
}

# Main
Stop-PortProcess -Port $Port
Start-Backend -Port $Port

Pop-Location
