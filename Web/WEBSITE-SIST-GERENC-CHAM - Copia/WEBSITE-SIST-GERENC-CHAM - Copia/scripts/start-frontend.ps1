<#
.SYNOPSIS
        Stop dev ports 5173/5174 if needed and start Vite on a fixed port.

.EXAMPLES
        .\start-frontend.ps1
        .\start-frontend.ps1 -Port 5173 -KillPorts -OpenBrowser
        .\start-frontend.ps1 -Install
#>
param(
        [int]$Port = 5173,
        [switch]$KillPorts = $true,
        [switch]$Install = $false,
        [switch]$OpenBrowser = $true
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Project root is the parent folder of this script directory
$ProjectRoot = Split-Path -Parent $PSScriptRoot
$LogsDir = Join-Path $ProjectRoot 'logs'
if (-not (Test-Path $LogsDir)) { New-Item -ItemType Directory -Path $LogsDir | Out-Null }

$outLog = Join-Path $LogsDir 'vite_out.log'
$errLog = Join-Path $LogsDir 'vite_err.log'
$pidFile = Join-Path $LogsDir 'frontend.pid'

# Clean old logs
Remove-Item $outLog, $errLog -Force -ErrorAction SilentlyContinue

Write-Host "Project root: $ProjectRoot"
if (-not (Test-Path (Join-Path $ProjectRoot 'package.json'))) {
    throw "package.json não encontrado em $ProjectRoot"
}

# Optionally install deps
if ($Install -or -not (Test-Path (Join-Path $ProjectRoot 'node_modules'))) {
    Write-Host 'Instalando dependências (npm install)...'
    Push-Location $ProjectRoot
    try {
        npm install | Tee-Object -FilePath $outLog -Append | Out-Host
    } finally { Pop-Location }
}

# Kill processes bound to selected ports (and common alt 5174)
if ($KillPorts) {
    $portsToFree = @($Port, 5174)
    foreach ($p in $portsToFree) {
        try {
            $procs = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess -Unique |
                Where-Object { $_ -and (Get-Process -Id $_ -ErrorAction SilentlyContinue) }
            if ($procs) {
                Write-Host "Liberando porta $p (encerrando PIDs: $($procs -join ', '))..."
                $procs | ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
                Start-Sleep -Milliseconds 300
            }
        } catch { Write-Warning "Falha ao liberar porta $($p): $($_)" }
    }
}

# Start Vite on fixed port with strictPort
Write-Host "Iniciando frontend (vite) na porta $Port..."
$args = @('/c','npm','run','dev','--','--port', "$Port", '--strictPort')
$proc = Start-Process -FilePath 'cmd.exe' -ArgumentList $args -WorkingDirectory $ProjectRoot -RedirectStandardOutput $outLog -RedirectStandardError $errLog -WindowStyle Hidden -PassThru
if (-not $proc) { throw 'Falha ao iniciar o processo do frontend.' }
$proc.Id | Out-File -FilePath $pidFile -Encoding ascii
Write-Host "Frontend iniciado. PID=$($proc.Id). Logs em $outLog"

# Wait until the port is listening (max ~20s)
$maxWait = 40
$ok = $false
for ($i=0; $i -lt $maxWait; $i++) {
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($conn) { $ok = $true; break }
    Start-Sleep -Milliseconds 500
}
if ($ok) {
    $url = "http://localhost:$Port/"
    Write-Host "Frontend pronto em $url"
    if ($OpenBrowser) {
        try { Start-Process opera $url -ErrorAction Stop } catch { Start-Process $url }
    }
} else {
    Write-Warning "A porta $Port não entrou em estado LISTEN a tempo. Verifique os logs: $outLog"
}

Write-Host 'Concluído.'
