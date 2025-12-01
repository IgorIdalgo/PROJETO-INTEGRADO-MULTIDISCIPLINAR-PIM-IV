# 🗺️ Mapa de Navegação do Projeto

## 📂 ESTRUTURA FINAL

```
WEBSITE-SIST-GERENC-CHAM/
│
├── 📁 src/                          ← Código React (Frontend)
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── NotificationCenter.tsx
│   │   └── ui/                      ← shadcn/ui components
│   ├── pages/                       ← Páginas (routes)
│   │   ├── Dashboard.tsx
│   │   ├── AllTickets.tsx
│   │   ├── MyTickets.tsx
│   │   ├── NewTicket.tsx
│   │   ├── TicketDetail.tsx
│   │   ├── Login.tsx
│   │   └── ...
│   ├── services/
│   │   ├── dataService.ts           ← Adapter (API ↔ Mock)
│   │   └── mockDataService.ts       ← Dados mock
│   ├── lib/
│   │   └── api.ts                   ← 🔑 Cliente HTTP!
│   ├── contexts/
│   │   └── AuthContext.tsx          ← Autenticação
│   └── main.tsx                     ← Ponto de entrada
│
├── 📁 BackendHelpDesk/              ← Código .NET (Backend)
│   ├── Program.cs                   ← Configuração principal
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── ChamadosController.cs
│   │   └── UsuariosController.cs
│   ├── Services/
│   │   └── Lógica de negócio
│   └── BackendHelpDesk.sln
│
├── 📁 public/                       ← Assets estáticos
│   └── robots.txt
│
├── 📁 docs/                         ← 📖 DOCUMENTAÇÃO (AQUI!)
│   ├── 00_INDICE.md                 ← Índice completo
│   ├── START_HERE.md                ← 🚀 Comece aqui!
│   ├── QUICKSTART.md                ← 5 minutos
│   ├── README.md
│   ├── INTEGRATION_JOURNEY.md       ← História completa
│   ├── AI_SUGGESTIONS_FLOW.md
│   ├── BACKEND_RESPONSIBILITIES.md
│   ├── TOKEN_STATUS_REPORT.md
│   ├── TROUBLESHOOTING.md           ← Problemas?
│   ├── STATUS.md
│   ├── INTEGRATION_GUIDE.md
│   ├── 00_RESUMO_FINAL.md
│   ├── FINAL_SUMMARY.txt
│   └── WELCOME.txt
│
├── 📁 scripts/                      ← 🔧 AUTOMAÇÃO
│   ├── start-dev.ps1                ← Inicia desenvolvimento
│   ├── start-frontend.ps1
│   ├── start-dev.sh
│   ├── test-external-api.ps1        ← Testa API
│   └── test-integration.js
│
├── 📁 logs/                         ← 📝 LOGS
│   ├── vite_out.log
│   ├── vite_err.log
│   └── frontend.pid
│
├── 📁 config/                       ← ⚙️ CONFIGURAÇÃO
│   ├── .env                         ← Variáveis de ambiente
│   └── .env.example
│
├── 🔧 Configuração (Raiz)
│   ├── package.json                 ← NPM dependencies
│   ├── tsconfig.json                ← TypeScript config
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts               ← Vite config
│   ├── tailwind.config.ts           ← TailwindCSS config
│   ├── postcss.config.js
│   ├── eslint.config.js
│   ├── components.json              ← shadcn/ui config
│   ├── index.html                   ← HTML principal
│   ├── .gitignore
│   ├── bun.lockb
│   ├── package-lock.json
│   └── WEBSITE-SIST-GERENC-CHAM.sln ← Solução Visual Studio
│
├── 📄 README_ORGANIZADO.md          ← Este é melhor que o README.md!
└── .env                             ← Configuração principal

```

---

## 🚀 PONTOS DE ENTRADA

### Para **Iniciantes** 👶
```
docs/START_HERE.md
   ↓
docs/QUICKSTART.md
   ↓
npm run dev
```

### Para **Desenvolvimento** 👨‍💻
```
src/main.tsx                    ← Ponto de entrada React
   ↓
src/App.tsx                     ← Componente raiz
   ↓
src/pages/Dashboard.tsx         ← Página principal
```

### Para **Backend** 🔷
```
BackendHelpDesk/Program.cs      ← Configuração principal
   ↓
BackendHelpDesk/Controllers/    ← Endpoints REST
   ↓
API: https://apichamadosunip2025-...
```

### Para **API** 🌐
```
src/lib/api.ts                  ← Cliente HTTP (IMPORTANTE!)
   ↓
apiGet, apiPost, apiPut, apiDelete
```

---

## 📊 FLUXO DE DADOS

```
┌─────────────────────┐
│  Página React       │
│  (pages/*.tsx)      │
└──────────┬──────────┘
           │
           ↓
┌─────────────────────┐
│  Service Layer      │
│  (dataService.ts)   │ ← Adapter pattern!
└──────────┬──────────┘
           │
      ┌────┴────┐
      ↓         ↓
   ┌────────────────┐    ┌──────────────────┐
   │  API Backend   │    │  Mock Data       │
   │  (azure)       │    │  (mockDataSvc)   │
   └────────────────┘    └──────────────────┘
```

---

## 🔑 ARQUIVOS CRÍTICOS

| Arquivo | Descrição | Importância |
|---------|-----------|------------|
| `src/lib/api.ts` | Cliente HTTP centralizado | 🔴 CRÍTICO |
| `src/contexts/AuthContext.tsx` | Autenticação | 🔴 CRÍTICO |
| `BackendHelpDesk/Program.cs` | Config backend | 🔴 CRÍTICO |
| `src/services/dataService.ts` | Adapter API/Mock | 🟡 Importante |
| `.env` | Configuração | 🟡 Importante |
| `src/pages/*.tsx` | Páginas | 🟢 Normal |

---

## ⚙️ VARIÁVEIS DE AMBIENTE

```env
# .env (raiz do projeto)
VITE_API_URL=https://apichamadosunip2025-b5fdcgfuccg2gtdt.brazilsouth-01.azurewebsites.net
```

---

## 📚 DOCUMENTAÇÃO POR TÓPICO

### 🔐 Autenticação
→ `docs/TOKEN_STATUS_REPORT.md`

### 🔗 Integração
→ `docs/INTEGRATION_JOURNEY.md`
→ `docs/INTEGRATION_GUIDE.md`

### 🤖 IA
→ `docs/AI_SUGGESTIONS_FLOW.md`

### 🚨 Problemas
→ `docs/TROUBLESHOOTING.md`

### 🔧 Backend
→ `docs/BACKEND_RESPONSIBILITIES.md`

---

## 🎯 FLUXO RECOMENDADO

```
1. Abrir: docs/00_INDICE.md (este arquivo!)
   ↓
2. Ler: docs/START_HERE.md
   ↓
3. Rodar: npm install && npm run dev
   ↓
4. Explorar: http://localhost:8080
   ↓
5. Debugar: docs/TROUBLESHOOTING.md (se necessário)
   ↓
6. Deploy: docs/INTEGRATION_GUIDE.md
```

---

## 💬 ATALHOS RÁPIDOS

**Iniciar:**
```bash
npm run dev
```

**Build:**
```bash
npm run build
```

**Preview:**
```bash
npm run preview
```

**Testes:**
```bash
cd BackendHelpDesk
.\start-backend.ps1
```

---

## ✅ CHECKLIST DE SETUP

- [ ] Ler `docs/START_HERE.md`
- [ ] Rodar `npm install`
- [ ] Configurar `.env` com API URL
- [ ] Rodar `npm run dev`
- [ ] Abrir `http://localhost:8080`
- [ ] Verificar integração em `docs/INTEGRATION_GUIDE.md`
- [ ] Testar endpoints com `scripts/test-external-api.ps1`

---

**Status:** ✅ Projeto Organizado  
**Última atualização:** 12/11/2025  
**Versão:** 1.0
