# 🔧 Responsabilidades do Backend

**O que o Backend está fazendo aqui?**

---

## 📊 Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────┐
│               Frontend (React/TypeScript)               │
│          (http://localhost:8080)                        │
└────────────────────────┬────────────────────────────────┘
                         │
                    HTTP/REST API
                         │
┌────────────────────────▼────────────────────────────────┐
│              BACKEND (ASP.NET Core 10)                  │
│          (http://localhost:5000)                        │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │          Controllers (HTTP Endpoints)            │  │
│  │ - AuthController (/api/auth/login)              │  │
│  │ - UsuariosController (/api/usuarios/*)          │  │
│  │ - ChamadosController (/api/chamados/*)          │  │
│  │ - HealthController (/api/health)                │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Business Services Layer                   │  │
│  │ - AuthService (validação de credenciais)        │  │
│  │ - UsuarioService (lógica de usuários)           │  │
│  │ - ChamadoService (lógica de chamados)           │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │        Data Access Layer (Repositories)         │  │
│  │ - UsuarioRepository (operações em usuários)    │  │
│  │ - ChamadoRepository (operações em chamados)    │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓                               │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Data Storage (In-Memory via ContextoFake)      │  │
│  │ - List<Usuario> com 2 usuários pré-carregados   │  │
│  │ - List<Chamado> com 2 chamados pré-carregados   │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Responsabilidades Principais

### 1. **Autenticação** ✅
- **Endpoint**: `POST /api/auth/login`
- **Entrada**: `{ login, senha }`
- **Saída**: `{ id, nome, login, nivelAcesso }`
- **O que faz**:
  - Valida credenciais contra banco em-memória
  - Retorna dados do usuário (sem JWT)
  - Retorna 401 se credenciais inválidas
- **Exemplo**:
  ```
  POST http://localhost:5000/api/auth/login
  { "login": "admin", "senha": "admin123" }
  → { "id": "uuid", "nome": "Administrador", "login": "admin", "nivelAcesso": "Administrador" }
  ```

### 2. **Gerenciamento de Usuários** ✅
- **Endpoints**:
  - `GET /api/usuarios` — Listar todos
  - `GET /api/usuarios/{id}` — Obter por ID
  - `POST /api/usuarios` — Criar novo
  - `PUT /api/usuarios/{id}` — Atualizar
  - `DELETE /api/usuarios/{id}` — Deletar
- **O que faz**:
  - CRUD completo de usuários
  - Validação de dados
  - Tratamento de erros (404, 500)
  - Logging de operações

### 3. **Gerenciamento de Chamados (Tickets)** ✅
- **Endpoints**:
  - `GET /api/chamados` — Listar todos
  - `GET /api/chamados/{id}` — Obter por ID
  - `GET /api/chamados/por-usuario/{usuarioId}` — Listar por usuário
  - `POST /api/chamados` — Criar novo
  - `PUT /api/chamados/{id}` — Atualizar
  - `DELETE /api/chamados/{id}` — Deletar
- **O que faz**:
  - CRUD completo de chamados
  - Validação: garante que usuário existe antes de criar chamado
  - Associa chamado ao usuário
  - Tracked: criatedAt, updatedAt
  - Logging de operações

### 4. **Health Check** ✅
- **Endpoint**: `GET /api/health`
- **Saída**: `{ status: "ok", timestamp }`
- **O que faz**:
  - Permite verificar se backend está vivo
  - Usado por scripts de teste/CI

### 5. **Configuração & Middleware** ✅
- **CORS**: Permite requisições do frontend (`AllowLocalhostDev`)
- **Swagger/OpenAPI**: Documentação interativa em `/swagger`
- **Exception Handler**: Captura erros não tratados e retorna JSON
- **Logging**: Injeta `ILogger<T>` em todos os controllers

---

## 📋 O Backend **NÃO** faz (ainda)

| Funcionalidade | Status | Onde está | Por quê |
|---------------|--------|-----------|---------|
| Comentários | ❌ Mock | Frontend | Não foi implementado no backend |
| Base de Conhecimento | ❌ Mock | Frontend | Não foi implementado no backend |
| Notificações | ❌ Mock | Frontend | Não foi implementado no backend |
| IA/Sugestões | ❌ Mock | Frontend | Não foi implementado no backend |
| JWT/Tokens | ❌ Simples | Backend | Por design (dados do usuário apenas) |
| Banco de Dados Real | ❌ In-Memory | Backend | Demo/Desenvolvimento (ContextoFake) |

---

## 🔄 Fluxo de Uma Requisição (Exemplo)

### Exemplo: Listar todos os chamados

```
1. Frontend: GET http://localhost:5000/api/chamados
           ↓
2. Backend recebe na porta 5000
           ↓
3. ChamadosController.GetAll()
           ↓
4. ChamadoService.Listar()
           ↓
5. ChamadoRepository.Listar()
           ↓
6. ContextoFake._chamados (List<Chamado> em memória)
           ↓
7. Retorna para Repository → Service → Controller
           ↓
8. Controller serializa para JSON e retorna 200 OK
           ↓
9. Frontend recebe: [{ id, titulo, descricao, ... }, ...]
```

---

## 🛠️ Stack & Padrões

| Camada | Tecnologia | Responsabilidade |
|--------|-----------|------------------|
| **HTTP** | ASP.NET Core Kestrel | Servidor web, roteamento |
| **Controllers** | `[ApiController]` | Recepcionar requisições HTTP |
| **Services** | `*Service.cs` | Lógica de negócio, validações |
| **Repository** | `I*Repository` + `*Repository.cs` | Operações CRUD em dados |
| **Models** | `Usuario.cs`, `Chamado.cs` | Entidades/DTOs |
| **Data** | `ContextoFake.cs` | Banco em memória |
| **DI** | `AddSingleton<>` | Injeção de dependências |

---

## ✅ Checklist de Responsabilidades Cumpridas

- ✅ Receber requisições HTTP na porta 5000
- ✅ Validar e autenticar usuários
- ✅ Fornecer dados de usuários (CRUD)
- ✅ Fornecer dados de chamados (CRUD)
- ✅ Validar regras de negócio (ex: usuário existe antes de criar chamado)
- ✅ Retornar respostas JSON apropriadas
- ✅ Tratar erros e retornar status codes corretos (401, 404, 500)
- ✅ Logar operações para debugging
- ✅ Habilitar CORS para frontend local
- ✅ Fornecer documentação Swagger
- ✅ Middleware global de exceções

---

## 🚀 Próximas Responsabilidades (Opcional)

Se quiser expandir o backend:

1. **Comentários em Chamados**
   - Novo modelo: `Comentario.cs`
   - Novo repositório: `ComentarioRepository.cs`
   - Novo controller: `ComentariosController.cs`
   - Endpoints: POST/GET/DELETE

2. **Base de Conhecimento**
   - Novo modelo: `ArtigoBase.cs`
   - Novo repositório: `ArtigoBaseRepository.cs`
   - Novo controller: `ArtigoBaseController.cs`

3. **Notificações**
   - Novo modelo: `Notificacao.cs`
   - Implementar sistema de notificações via WebSocket ou polling

4. **Autenticação Real**
   - Implementar JWT com refresh tokens
   - Hash de senhas (BCrypt/Argon2)
   - Rate limiting em `/api/auth/login`

5. **Banco de Dados Real**
   - Migrar de `ContextoFake` para Entity Framework Core
   - SQL Server / PostgreSQL / MySQL

---

## 📞 Resumo

**Backend está sendo responsável por:**
- ✅ Validar autenticação
- ✅ Servir dados de usuários
- ✅ Servir dados de chamados
- ✅ Aplicar regras de negócio
- ✅ Logar/debugar operações
- ✅ Expor endpoints REST documentados

**Frontend está sendo responsável por:**
- ✅ Renderizar UI
- ✅ Fazer requisições HTTP
- ✅ Armazenar sessão (localStorage)
- ✅ Fallback automático para mock se backend indisponível

**Separação de responsabilidades: ✅ Limpa!**
