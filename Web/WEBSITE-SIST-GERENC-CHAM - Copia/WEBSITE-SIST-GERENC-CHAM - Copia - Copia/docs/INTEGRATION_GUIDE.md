# Integração Frontend + Backend HelpDesk

## 📋 Visão Geral

Este projeto integra um frontend React (TypeScript + Vite + TailwindCSS) com um backend .NET 10 (ASP.NET Core).

### Arquitetura
- **Frontend**: React 18, TypeScript, Vite, componentes shadcn/ui, React Router, React Hook Form
- **Backend**: ASP.NET Core 10, em memória (ContextoFake), sem JWT, com CORS habilitado para dev
- **Integração**: API REST via `fetch`, fallback automático para dados mock se backend indisponível

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18.16.1+ (ou bun)
- .NET 10 SDK
- npm ou bun
- PowerShell (para usar scripts de start/stop do backend)

### 1. Backend (.NET)

#### Opção A: Using PowerShell Scripts (Recomendado)

Scripts de start/stop evitam conflitos de porta automaticamente:

```powershell
cd BackendHelpDesk
.\start-backend.ps1          # Inicia backend em Development, salva PID em backend.pid
# ... use o backend
.\stop-backend.ps1           # Para o backend usando o PID ou procurando por processos na porta 5000
```

Veja `BackendHelpDesk/DEV_STARTUP.md` para opções avançadas (`-Port` para usar porta diferente).

#### Opção B: Manual (sem script)

```powershell
cd BackendHelpDesk
dotnet restore
dotnet run
```

O backend estará disponível em:
- API: `http://localhost:5000`
- Swagger (documentação): `http://localhost:5000/swagger`

**Endpoints principais:**
- `POST /api/auth/login` — Autenticação
- `GET /api/chamados` — Listar tickets
- `POST /api/chamados` — Criar ticket
- `GET /api/usuarios` — Listar usuários
- `POST /api/usuarios` — Criar usuário

### 2. Frontend (React + Vite)

Em outro terminal:

```powershell
cd . # (raiz do projeto)
npm install
npm run dev
```

O frontend estará disponível em:
- Local: `http://localhost:8080`
- Network: `http://<seu-ip>:8080`

---

## 🔗 Configuração da Integração

### Arquivo `.env`

Na raiz do projeto, crie um arquivo `.env` (ou copie de `.env.example`):

```env
VITE_API_URL=http://localhost:5000
```

**Comportamento:**
- Com `VITE_API_URL` definido: o frontend tenta chamar o backend; se falhar, cai para mock.
- Sem `VITE_API_URL` (ou vazio): usa apenas dados mock locais.

### Fluxo de Autenticação

1. Usuário faz login no frontend (página `/login`).
2. Frontend chama `POST /api/auth/login` com `{ login, senha }`.
3. Se backend responde: usuário é mapeado e armazenado em `localStorage`.
4. Se backend falha: cai para usuários mock locais (`joao@empresa.com`, `ana@suporte.com`, `carlos@admin.com` com senha `senha123`).

### Fluxo de Dados (Chamados, Usuários, etc.)

O frontend importa funções de `src/services/dataService.ts`:
- Este adaptador tenta chamadas ao backend (`src/services/apiDataService.ts`).
- Se falham ou não implementadas: cai para `src/services/mockDataService.ts`.
- Nenhuma mudança necessária no resto do app — a lógica é transparente.

---

## 📁 Estrutura de Arquivos Relevantes

```
/
├── .env                              # (criar) Variáveis de ambiente
├── .env.example                      # Exemplo de .env
├── src/
│   ├── lib/api.ts                    # Client HTTP com apiGet, apiPost, etc.
│   ├── contexts/AuthContext.tsx      # Autenticação (tenta backend, cai para mock)
│   ├── services/
│   │   ├── dataService.ts            # Adaptador (seleciona API ou mock)
│   │   ├── apiDataService.ts         # Chamadas ao backend
│   │   └── mockDataService.ts        # Dados estáticos (fallback)
│   └── pages/Login.tsx               # Página de login
└── BackendHelpDesk/
    ├── Program.cs                    # Configuração ASP.NET Core (CORS, services)
    ├── Controllers/
    │   ├── AuthController.cs         # POST /api/auth/login
    │   ├── UsuariosController.cs     # CRUD usuários
    │   └── ChamadosController.cs     # CRUD chamados
    ├── Models/
    │   ├── Usuario.cs
    │   ├── Chamado.cs
    │   └── Enums.cs
    ├── Data/
    │   ├── ContextoFake.cs           # Banco em memória
    │   ├── Repositories/             # Padrão repository
    │   └── ...
    └── Business/Services/            # Lógica de negócio
```

---

## 🧪 Testes de Integração

### Teste via Node.js

```bash
node test-integration.js
```

Testa:
- Backend está respondendo
- GET /api/chamados retorna lista
- GET /api/usuarios retorna lista
- POST /api/auth/login autentica corretamente

### Teste via Frontend

1. Abra `http://localhost:8080` no navegador.
2. Faça login com:
   - **Email**: `admin`
   - **Senha**: `admin123`
   - (ou use mock: `joao@empresa.com` / `senha123`)
3. Navegue para "Meus Chamados" para testar listagem de dados.
4. Abra DevTools (F12) → Network para ver chamadas HTTP.

---

## 🔄 Fallback Automático (Mock)

Se o backend estiver indisponível:
- Login usando usuários mock.
- Dados de chamados, comentários, base de conhecimento via mock local.
- **Sem mudanças no código frontend** — funciona transparentemente.

Logs no console do navegador mostram:
```
Backend auth failed or unreachable, falling back to mock users
```

---

## 🛠️ Desenvolvimento

### Adicionar um novo endpoint no backend

1. Crie um novo método no `RepositorioXxx` (ex: `RepositorioChamados.cs`).
2. Implemente a lógica em `ServicoxXxx.cs` (ex: `ChamadoService.cs`).
3. Exponha via `[HttpGet]` / `[HttpPost]` no `ControladorXxx.cs` (ex: `ChamadosController.cs`).
4. No frontend, adicione a chamada em `src/services/apiDataService.ts`.
5. Atualize `src/services/dataService.ts` para exportar a nova função.

### Adicionar suporte a comentários no backend (exemplo)

Atualmente comentários e base de conhecimento usam mock. Para integrar com backend:
1. Crie models: `Comentario.cs`, `ArtigoBase.cs`.
2. Implemente repositórios e serviços.
3. Adicione endpoints em novo `ComentariosController.cs`.
4. Implemente em `apiDataService.ts` (agora não lança erro).
5. Teste via frontend.

---

## 📝 Credenciais de Teste

### Backend (ContextoFake)
- **Admin**: `login=admin`, `senha=admin123`
- **Colaborador**: `login=colab`, `senha=colab123`

### Frontend (Mock)
- **Colaborador**: `joao@empresa.com` / `senha123`
- **Técnico**: `ana@suporte.com` / `senha123`
- **Admin**: `carlos@admin.com` / `senha123`

---

## ⚠️ Notas Importantes

### Segurança
- **Nunca** armazene senhas em texto simples em produção.
- Implemente hashing (BCrypt, Argon2) no backend.
- Configure JWT ou Sessions para autenticação real.
- Restrinja CORS em produção (`app.UseCors(policy => policy.WithOrigins("https://seu-dominio.com"))`).
- Adicione rate limiting, validação de entrada, etc.

### Ambiente de Produção
- Compor Docker: `Dockerfile` + `docker-compose.yml`.
- Configurar banco de dados real (SQL Server, PostgreSQL).
- Habilitar HTTPS com certificados válidos.
- Usar variáveis de ambiente para URLs/secrets.

### Troubleshooting

**Backend não inicia:**
- Verificar porta 5000 em uso: `netstat -ano | findstr :5000`
- Usar script: `.\BackendHelpDesk\stop-backend.ps1` para liberar a porta
- Limpar e reconstruir: `dotnet clean && dotnet restore && dotnet build`

**Frontend não conecta ao backend:**
- Verificar `.env` tem `VITE_API_URL=http://localhost:5000`
- Verificar que backend está rodando: `http://localhost:5000/swagger` deve abrir no navegador
- DevTools → Network → verificar chamadas para `/api/auth/login`
- Verificar logs do navegador para warnings de CORS

**Build falha:**
- `.NET`: verificar versão com `dotnet --version`
- Node: verificar versão com `node --version`
- Limpar `node_modules` e reinstalar: `rm -r node_modules && npm install`

**Porta já em uso (Address already in use):**
- Use o script: `.\BackendHelpDesk\stop-backend.ps1` (mata qualquer processo na porta)
- Ou manualmente: `Get-NetTCPConnection -LocalPort 5000 | Select-Object -Expand OwningProcess -Unique` seguido de `Stop-Process -Id <PID> -Force`

---

## 📚 Recursos

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [ASP.NET Core Docs](https://learn.microsoft.com/en-us/aspnet/core/)
- [Vite Guide](https://vitejs.dev/guide/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 Suporte

Para dúvidas ou issues:
1. Verifique os logs (terminal backend, console frontend).
2. Consulte a seção Troubleshooting acima.
3. Abra uma issue com detalhes do erro e steps para reproduzir.

---

**Última atualização**: 2025-11-11  
**Status**: ✅ Integração completa, pronto para testes e desenvolvimento.
