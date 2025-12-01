# Script de teste da integração com API do Azure

$baseUrl = "https://apichamadosunip2025-b5fdcgfuccg2gtdt.brazilsouth-01.azurewebsites.net"

Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     TESTE DE INTEGRAÇÃO - API AZURE + FRONTEND            ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝`n" -ForegroundColor Cyan

# Teste 1: Verificar se API está online
Write-Host "1️⃣  Verificando se API está online..." -ForegroundColor Yellow
try {
    $healthResp = Invoke-RestMethod -Uri $baseUrl -Method GET -ErrorAction Stop
    Write-Host "   ✅ API Online: $healthResp" -ForegroundColor Green
} catch {
    Write-Host "   ❌ API Offline ou inacessível" -ForegroundColor Red
    exit 1
}

# Teste 2: Tentar login com credenciais mock (deve falhar com 401)
Write-Host "`n2️⃣  Testando login com credenciais mock (deve falhar)..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "joao@empresa.com"
        senha = "senha123"
    } | ConvertTo-Json
    
    $loginResp = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ Login OK (inesperado!)" -ForegroundColor Green
    Write-Host "   Token: $($loginResp.token)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ 401 Unauthorized (esperado - credenciais não existem no Azure)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Status $statusCode (inesperado)" -ForegroundColor Yellow
    }
}

# Teste 3: Tentar acessar chamados sem autenticação (deve retornar 401)
Write-Host "`n3️⃣  Testando acesso sem autenticação..." -ForegroundColor Yellow
try {
    $chamadosResp = Invoke-RestMethod -Uri "$baseUrl/api/chamados/meus" -Method GET -ErrorAction Stop
    Write-Host "   ❌ Acesso permitido sem auth (problema de segurança!)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "   ✅ 401 Unauthorized (esperado - sem token)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Status $statusCode" -ForegroundColor Yellow
    }
}

# Teste 4: Verificar estrutura do .env
Write-Host "`n4️⃣  Verificando configuração do frontend..." -ForegroundColor Yellow
$envFile = Join-Path $PSScriptRoot ".." ".env"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "VITE_API_URL=(.+)") {
        $apiUrl = $matches[1].Trim()
        if ($apiUrl -eq $baseUrl) {
            Write-Host "   ✅ .env configurado corretamente" -ForegroundColor Green
            Write-Host "   URL: $apiUrl" -ForegroundColor Gray
        } else {
            Write-Host "   ⚠️  .env com URL diferente:" -ForegroundColor Yellow
            Write-Host "   Esperado: $baseUrl" -ForegroundColor Gray
            Write-Host "   Atual: $apiUrl" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ❌ VITE_API_URL não encontrado no .env" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ Arquivo .env não encontrado" -ForegroundColor Red
}

# Resumo
Write-Host "`n╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                    RESUMO DO TESTE                         ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

Write-Host "`n✅ API Azure está ONLINE e respondendo" -ForegroundColor Green
Write-Host "🔐 API requer autenticação (Bearer token) para endpoints protegidos" -ForegroundColor Yellow
Write-Host "⚠️  Credenciais mock não funcionam na API real" -ForegroundColor Yellow
Write-Host "`n📝 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. Descobrir credenciais válidas da API do Azure" -ForegroundColor White
Write-Host "   2. Ou criar um novo usuário na API (se houver endpoint de registro)" -ForegroundColor White
Write-Host "   3. Frontend irá fazer fallback para mock se login falhar" -ForegroundColor White

Write-Host "`n🚀 Para testar o frontend:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "   Use credenciais mock para testar funcionalidades" -ForegroundColor Gray
Write-Host ""
