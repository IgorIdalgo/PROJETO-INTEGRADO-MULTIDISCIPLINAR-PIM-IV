# Start both backend and frontend for development
# Usage: .\start-dev.ps1

Write-Host "🚀 Starting HelpDesk Development Environment" -ForegroundColor Green
Write-Host ""

# Check if backend is already running
$backendPort = 5000
$backendRunning = $null -ne (Get-NetTCPConnection -LocalPort $backendPort -ErrorAction SilentlyContinue)

if ($backendRunning) {
    Write-Host "⚠️  Backend port $backendPort already in use. Skipping backend startup." -ForegroundColor Yellow
} else {
    Write-Host "📦 Starting Backend (.NET)..." -ForegroundColor Cyan
    $backendPath = Join-Path $PSScriptRoot "BackendHelpDesk"
    Start-Process -FilePath "dotnet" -ArgumentList "run" -WorkingDirectory $backendPath -NoNewWindow
    Write-Host "   Backend is starting. It will listen on http://localhost:5000" -ForegroundColor Green
    Start-Sleep -Seconds 3
}

# Check if frontend is already running
$frontendPort = 8080
$frontendRunning = $null -ne (Get-NetTCPConnection -LocalPort $frontendPort -ErrorAction SilentlyContinue)

if ($frontendRunning) {
    Write-Host "⚠️  Frontend port $frontendPort already in use. Skipping frontend startup." -ForegroundColor Yellow
} else {
    Write-Host "⚛️  Starting Frontend (React/Vite)..." -ForegroundColor Cyan
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory $PSScriptRoot -NoNewWindow
    Write-Host "   Frontend is starting. It will be available at http://localhost:8080" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Development environment is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Yellow
Write-Host "  - Frontend:  http://localhost:8080" -ForegroundColor White
Write-Host "  - Backend:   http://localhost:5000" -ForegroundColor White
Write-Host "  - Swagger:   http://localhost:5000/swagger" -ForegroundColor White
Write-Host ""
Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host "  - Email: admin | Password: admin123" -ForegroundColor White
Write-Host "  - Email: colab | Password: colab123" -ForegroundColor White
Write-Host ""
Write-Host "To stop the servers, close the terminals or press Ctrl+C" -ForegroundColor Gray
