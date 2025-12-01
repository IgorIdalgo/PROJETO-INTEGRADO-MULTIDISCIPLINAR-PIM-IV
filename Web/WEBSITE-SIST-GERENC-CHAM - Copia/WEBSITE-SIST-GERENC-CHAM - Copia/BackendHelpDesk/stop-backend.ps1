<#
.SYNOPSIS
    Stop BackendHelpDesk API that was started with start-backend.ps1

.DESCRIPTION
    This script will attempt to stop the backend process using the PID saved in
    backend.pid. If the PID is not available it will attempt to find processes
    listening on the configured port and stop them.

.USAGE
    .\stop-backend.ps1 [-Port 5000]
#>

param(
    [int]$Port = 5000
)

Set-StrictMode -Version Latest
Push-Location -Path $PSScriptRoot

$pidFile = Join-Path $PSScriptRoot 'backend.pid'

if (Test-Path $pidFile) {
    try {
        $savedPid = Get-Content $pidFile | Select-Object -First 1
        if ($savedPid) {
            try {
                Write-Host "Stopping backend PID $savedPid..."
                Stop-Process -Id $savedPid -Force -ErrorAction Stop
                Write-Host "Stopped PID $savedPid"
            } catch {
                Write-Warning "Failed to stop PID $savedPid`: $($_.Exception.Message)"
            }
        }
    } catch {
        Write-Warning "Could not read PID file: $($_.Exception.Message)"
    }
    try { Remove-Item $pidFile -ErrorAction SilentlyContinue } catch {}
} else {
    Write-Host "No PID file found, searching for processes listening on port $Port..."
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($conns) {
            $pids = $conns | Select-Object -Expand OwningProcess -Unique
            foreach ($procPid in $pids) {
                try {
                    Write-Host "Stopping PID $procPid (listening on port $Port)..."
                    Stop-Process -Id $procPid -Force -ErrorAction Stop
                    Write-Host "Stopped PID $procPid"
                } catch {
                    Write-Warning "Failed to stop PID $procPid`: $($_.Exception.Message)"
                }
            }
        } else {
            Write-Host "No process listening on port $Port"
        }
    } catch {
        Write-Warning "Error while checking port: $($_.Exception.Message)"
    }
}

Pop-Location
