@echo off
REM Script para reiniciar completamente o sistema HelpDesk
REM Mata Node e .NET, inicia backend e frontend, abre navegador

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   REINICIANDO SISTEMA HELPDESK
echo ========================================
echo.

REM Mata Node
echo [1/4] Matando processos Node...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

REM Mata .NET (dotnet)
echo [2/4] Matando processos .NET...
taskkill /F /IM dotnet.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo [3/4] Aguardando 3 segundos...
timeout /t 3 /nobreak >nul

REM Inicia Backend
echo [4/4] Iniciando Backend em http://localhost:5000...
start cmd /k "cd /d c:\Users\ana.ferreira\Downloads\programação\WEBSITE-SIST-GERENC-CHAM - Copia\WEBSITE-SIST-GERENC-CHAM - Copia\BackendHelpDesk && dotnet run"
timeout /t 3 /nobreak >nul

REM Inicia Frontend (mata processo na porta 5173 se necessário)
echo Iniciando Frontend em http://localhost:5173...
for /f "tokens=5" %%a in ('netstat -ano ^| find ":5173"') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 /nobreak >nul

start cmd /k "cd /d c:\Users\ana.ferreira\Downloads\programação\WEBSITE-SIST-GERENC-CHAM - Copia\WEBSITE-SIST-GERENC-CHAM - Copia && npm run dev"
timeout /t 5 /nobreak >nul

REM Abre navegador
echo Abrindo navegador...
start http://localhost:5173

echo.
echo ========================================
echo   ✓ SISTEMA INICIADO COM SUCESSO!
echo ========================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173
echo.
pause
