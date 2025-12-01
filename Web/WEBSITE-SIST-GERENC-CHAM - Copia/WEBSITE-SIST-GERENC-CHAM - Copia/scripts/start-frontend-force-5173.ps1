# Script para iniciar frontend SEMPRE na porta 5173
# Se a porta estiver ocupada, mata o processo e reinicia

Write-Host "🔄 Verificando porta 5173..." -ForegroundColor Yellow

# Verifica se algo está usando a porta 5173
$processPort = netstat -ano | Select-String ":5173" | Select-Object -First 1
if ($processPort) {
    Write-Host "⚠️  Porta 5173 já está em uso. Matando processo..." -ForegroundColor Yellow
    
    # Extrai o PID da linha do netstat
    $pidMatch = $processPort -match '\s(\d+)\s*$'
    if ($pidMatch) {
        $processId = $matches[1]
        Write-Host "🔪 Terminando processo PID: $processId" -ForegroundColor Red
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

Write-Host "✅ Iniciando frontend na porta 5173..." -ForegroundColor Green
Write-Host ""

# Inicia o frontend
Set-Location "c:\Users\ana.ferreira\Downloads\programação\WEBSITE-SIST-GERENC-CHAM - Copia\WEBSITE-SIST-GERENC-CHAM - Copia"
npm run dev
