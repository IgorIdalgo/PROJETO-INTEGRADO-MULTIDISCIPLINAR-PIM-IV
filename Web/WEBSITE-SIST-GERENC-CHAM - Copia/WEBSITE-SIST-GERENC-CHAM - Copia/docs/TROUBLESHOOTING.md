# 🔧 Troubleshooting - Integração Backend + Frontend

## Status Atual ✅

- [x] Frontend (React/Vite) — Rodando OK em `http://localhost:8080`
- [x] Backend (ASP.NET .NET 10) — Compilado OK, mas com problema de runtime
- [x] CORS habilitado no backend
- [x] Cliente API (`src/lib/api.ts`) funcional
- [x] Autenticação com fallback para mock
- [x] Serviços adapter implementados
- [ ] Backend rodando continuamente sem encerrar

---

## Problema Identificado

O backend ASP.NET Core 10 está:
1. Iniciando corretamente (`Now listening on: http://localhost:5000`)
2. Encerrando abruptamente quando:
   - Recebe primeira requisição HTTP
   - Ou quando executado com `DOTNET_ENVIRONMENT=Development`

**Causa provável:**
- Erro não capturado em middleware ou controller
- Problema com inicialização de repositórios/serviços
- Versão .NET 10 incompatível com algum pacote

---

## Soluções Recomendadas

### Opção 1: Adicionar Try-Catch Global (Rápido)

No `Program.cs`, adicione middleware de erro:

```csharp
// Após app = builder.Build();
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        if (exceptionHandlerPathFeature?.Error is Exception ex)
        {
            await context.Response.WriteAsJsonAsync(new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    });
});
```

### Opção 2: Regredir para .NET 8 (Mais Seguro)

Se .NET 10 tiver issues de compatibilidade:

```bash
cd BackendHelpDesk
# Instalar .NET 8 SDK
dotnet --list-sdks

# Atualizar csproj
# Mudar <TargetFramework>net10.0</TargetFramework> para net8.0
```

### Opção 3: Usar Docker (Isolado)

Crie `Dockerfile` no `BackendHelpDesk/`:

```dockerfile
FROM mcr.microsoft.com/dotnet/runtime:10.0 as runtime
FROM mcr.microsoft.com/dotnet/sdk:10.0 as builder

WORKDIR /src
COPY . .
RUN dotnet publish -c Release -o /app

FROM runtime
WORKDIR /app
COPY --from=builder /app .
EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
CMD ["dotnet", "BackendHelpDesk.Api.dll"]
```

```bash
docker build -t backendhelpdisk .
docker run -p 5000:5000 backendhelpdisk
```

### Opção 4: Usar Backend Mock com JSON Server (Alternativo)

Crie um fake backend em Node.js para testes rápidos:

```bash
npm install -g json-server
```

`db.json`:
```json
{
  "usuarios": [
    { "id": "1", "nome": "Admin", "login": "admin", "nivelAcesso": "Administrador" }
  ],
  "chamados": [
    { "id": "1", "titulo": "Problema 1", "descricao": "Teste", "usuarioId": "1", "status": "Aberto" }
  ]
}
```

```bash
json-server --watch db.json --port 5000
```

---

## Próximos Passos

### 1. Verificar Logs Detalhados

```bash
cd BackendHelpDesk
dotnet run --verbosity diagnostic 2>&1 | Out-File -FilePath backend-debug.log
```

### 2. Testar Endpoints Individuais

Uma vez que backend esteja estável, teste:

```powershell
# Login
curl -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"login":"admin","senha":"admin123"}'

# Listar chamados
curl http://localhost:5000/api/chamados

# Listar usuários
curl http://localhost:5000/api/usuarios
```

### 3. Testar Frontend

```bash
npm run dev
# Abrir http://localhost:8080
# Login com admin/admin123
# Verificar Network tab em DevTools
```

### 4. Executar Testes Integrados

```bash
node test-integration.js
```

---

## Workaround Temporal

Enquanto resolve o backend, a app funcionará 100% com dados mock:

1. Remova ou comente `VITE_API_URL` em `.env`
2. Frontend usa `mockDataService.ts` automaticamente
3. Login e operações CRUDL funcionam com dados locais

---

## Resources

- [ASP.NET Core Troubleshooting](https://learn.microsoft.com/en-us/aspnet/core/troubleshoot/)
- [.NET Diagnostics](https://learn.microsoft.com/en-us/dotnet/core/diagnostics/)
- [JSON Server](https://github.com/typicode/json-server)

---

**Próxima ação recomendada:** Adicione o middleware de erro global no `Program.cs` para capturar exceções e gerar logs úteis.
