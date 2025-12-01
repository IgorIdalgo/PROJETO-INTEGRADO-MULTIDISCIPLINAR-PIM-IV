# 📑 Índice de Documentação

## 🗂️ Estrutura do Projeto

```
WEBSITE-SIST-GERENC-CHAM/
├── src/                    # Código-fonte React (Frontend)
├── BackendHelpDesk/        # Código-fonte .NET Core (Backend)
├── public/                 # Assets estáticos
├── node_modules/           # Dependências NPM
│
├── 📁 docs/                # Documentação (você está aqui)
│   ├── 00_INDICE.md       # Este arquivo
│   ├── START_HERE.md      # 🚀 Comece por aqui!
│   ├── QUICKSTART.md      # Guia rápido
│   ├── README.md          # Documentação geral
│   ├── INTEGRATION_JOURNEY.md        # Histórico completo da integração
│   ├── AI_SUGGESTIONS_FLOW.md        # Fluxo de sugestões de IA
│   ├── BACKEND_RESPONSIBILITIES.md   # Responsabilidades do backend
│   ├── TOKEN_STATUS_REPORT.md        # Status de autenticação
│   ├── TROUBLESHOOTING.md            # Solução de problemas
│   ├── STATUS.md          # Status do projeto
│   ├── INTEGRATION_GUIDE.md          # Guia de integração
│   └── ...
│
├── 📁 scripts/             # Scripts de automação
│   ├── start-dev.ps1      # Inicia frontend
│   ├── start-frontend.ps1 # Alternativa de início
│   ├── test-external-api.ps1   # Testa API externa
│   ├── test-integration.js     # Testes de integração
│   └── ...
│
├── 📁 logs/                # Arquivos de log
│   ├── vite_out.log       # Output do Vite
│   ├── vite_err.log       # Erros do Vite
│   └── ...
│
├── 📁 config/              # Arquivos de configuração
│   ├── .env               # Variáveis de ambiente
│   └── .env.example       # Exemplo de .env
│
├── Arquivos de Configuração
│   ├── package.json       # Dependências e scripts NPM
│   ├── tsconfig.json      # Configuração TypeScript
│   ├── vite.config.ts     # Configuração Vite
│   ├── tailwind.config.ts # Configuração Tailwind CSS
│   └── ...
│
└── BackendHelpDesk/
    ├── Program.cs         # Configuração principal .NET
    ├── Controllers/       # Endpoints REST
    ├── Services/          # Lógica de negócio
    └── ...
```

---

## 🚀 Como Começar

### 1️⃣ **Primeira Vez?**
👉 Leia: **`docs/START_HERE.md`**

### 2️⃣ **Quer um Guia Rápido?**
👉 Leia: **`docs/QUICKSTART.md`**

### 3️⃣ **Problemas?**
👉 Leia: **`docs/TROUBLESHOOTING.md`**

---

## 📚 Documentos Disponíveis

| Documento | Descrição |
|-----------|-----------|
| **START_HERE.md** | 🚀 Ponto de entrada principal |
| **QUICKSTART.md** | ⚡ Guia rápido de 5 minutos |
| **README.md** | 📖 Visão geral do projeto |
| **INTEGRATION_JOURNEY.md** | 🔍 Histórico completo da integração |
| **AI_SUGGESTIONS_FLOW.md** | 🤖 Como funciona sugestões de IA |
| **BACKEND_RESPONSIBILITIES.md** | 🔧 O que o backend faz |
| **TOKEN_STATUS_REPORT.md** | 🔐 Status de autenticação |
| **TROUBLESHOOTING.md** | 🆘 Solução de problemas |
| **STATUS.md** | 📊 Status atual do projeto |
| **INTEGRATION_GUIDE.md** | 🔗 Guia de integração |

---

## 🛠️ Scripts Disponíveis

| Script | Uso |
|--------|-----|
| **scripts/start-dev.ps1** | Inicia desenvolvimento |
| **scripts/start-frontend.ps1** | Inicia frontend Vite |
| **scripts/test-external-api.ps1** | Testa API externa |
| **scripts/test-integration.js** | Testes de integração |

---

## 🔧 Stack Técnico

### Frontend
- ⚛️ React 18
- 🎨 TailwindCSS + shadcn/ui
- 🛣️ React Router v6
- 🎯 TypeScript
- ⚡ Vite

### Backend
- 🔷 ASP.NET Core 10 (.NET 10)
- 📦 REST API
- 🗄️ In-memory data (ContextoFake)

### API Externa (Azure)
- 🌐 URL: `https://apichamadosunip2025-b5fdcgfuccg2gtdt.brazilsouth-01.azurewebsites.net`
- 📍 Endpoints: `/api/chamados/meus`, `/api/chamados`

---

## 📊 Status do Projeto

- ✅ Frontend rodando: `http://localhost:8080`
- ✅ API Azure online e respondendo
- ✅ Integração em progresso
- 🔄 Autenticação: Configuração pendente

---

## 💡 Dicas Rápidas

```bash
# Instalar dependências
npm install

# Iniciar desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview de produção
npm run preview
```

---

## 📞 Próximos Passos

1. ✅ Verificar `/docs/START_HERE.md`
2. ✅ Configurar autenticação com Azure
3. ✅ Testar integração completa
4. ✅ Deploy em produção

---

**Última atualização:** 12/11/2025  
**Versão do Projeto:** 1.0
