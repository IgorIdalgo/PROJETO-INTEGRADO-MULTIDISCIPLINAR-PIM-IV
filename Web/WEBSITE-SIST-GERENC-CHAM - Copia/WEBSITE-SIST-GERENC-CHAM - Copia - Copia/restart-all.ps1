# Script PowerShell para reiniciar completamente o sistema HelpDesk
# Mata Node e .NET, inicia backend e frontend, abre navegador

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REINICIANDO SISTEMA HELPDESK" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Caminho base
$baseDir = "c:\Users\ana.ferreira\Downloads\programacao\WEBSITE-SIST-GERENC-CHAM - Copia\WEBSITE-SIST-GERENC-CHAM - Copia"
$backendDir = "$baseDir\BackendHelpDesk"

# [1] Mata Node
Write-Host "[1/5] Matando processos Node..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# [2] Mata .NET
Write-Host "[2/5] Matando processos .NET..." -ForegroundColor Yellow
Get-Process -Name dotnet -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# [3] Aguarda
Write-Host "[3/5] Aguardando 3 segundos..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# [4] Mata processo na porta 5173 (se houver)
Write-Host "[4/5] Limpando porta 5173..." -ForegroundColor Yellow
$port5173 = netstat -ano | Select-String ":5173" | Select-Object -First 1
if ($port5173) {
    $pidMatch = $port5173 -match '\s(\d+)\s*$'
    if ($pidMatch) {
        $processId = $matches[1]
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
    }
}

# [5] Inicia Backend
Write-Host "[5/5] Iniciando Backend..." -ForegroundColor Green
Write-Host "   Acessivel em: http://localhost:5000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; dotnet run"
Start-Sleep -Seconds 4

# [6] Inicia Frontend
Write-Host "Iniciando Frontend..." -ForegroundColor Green
Write-Host "   Acessivel em: http://localhost:5173" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$baseDir'; npm run dev"
Start-Sleep -Seconds 5

# [7] Abre navegador
Write-Host "Abrindo navegador..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SISTEMA INICIADO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Yellow
Write-Host "   Backend:  http://localhost:5000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Credenciais de Teste:" -ForegroundColor Yellow
Write-Host "   Tecnico     | tecnico      | tecnico123" -ForegroundColor White
Write-Host "   Colaborador | colab        | colab123" -ForegroundColor White
Write-Host "   Admin       | admin        | admin123" -ForegroundColor White
Write-Host ""
