# HelpDesk - Sistema de Gerenciamento de Chamados

![Status](https://img.shields.io/badge/Status-Ready%20to%20Use-brightgreen)
![Frontend](https://img.shields.io/badge/Frontend-React%2018-blue)
![Backend](https://img.shields.io/badge/Backend-.NET%2010-purple)
![Integration](https://img.shields.io/badge/Integration-Complete-success)

> Sistema de gestão de chamados de suporte técnico com frontend React e backend ASP.NET Core

## 🎯 Acesso Rápido

```bash
# Começar agora (sem setup)
npm run dev
# Abra: http://localhost:8080
# Login: joao@empresa.com / senha123
```

## 📚 Documentação

| Documento | Conteúdo |
|-----------|----------|
| **[WELCOME.txt](WELCOME.txt)** | 👈 **COMECE AQUI** - Visão geral visual |
| **[README-INTEGRATION.md](README-INTEGRATION.md)** | Guia de integração frontend + backend |
| **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** | Documentação técnica completa |
| **[QUICKSTART.md](QUICKSTART.md)** | Referência rápida de comandos |
| **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** | Solução de problemas |
| **[STATUS.md](STATUS.md)** | Status detalhado do projeto |

## 🚀 Features

- ✅ **Autenticação** com sistema de roles (Colaborador, Técnico, Admin)
- ✅ **CRUD de Chamados** - criar, visualizar, editar, fechar
- ✅ **Sistema de Prioridades** - Baixa, Média, Alta, Crítica
- ✅ **Gerenciamento de Usuários** - visualizar e gerenciar usuários
- ✅ **Base de Conhecimento** - artigos para auto-atendimento
- ✅ **Notificações** - alertas em tempo real
- ✅ **Dashboard** - visão geral dos chamados
- ✅ **Interface Responsiva** - funciona em desktop, tablet, mobile

## 🛠️ Stack Tecnológico

### Frontend
- React 18 com TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- shadcn/ui (componentes)
- React Router DOM (navegação)
- React Hook Form (formulários)
- Zod (validação)

### Backend
- ASP.NET Core 10
- C#
- Arquitetura em Camadas
- Em-memória (ready para integração com EF Core + SQL)
- Swagger (documentação automática)

## 📋 Estrutura do Projeto

```
project/
├── src/                          # Frontend React
│   ├── components/               # Componentes React
│   ├── pages/                    # Páginas (Dashboard, Tickets, etc)
│   ├── services/
│   │   ├── dataService.ts        # Adapter (real vs mock)
│   │   ├── apiDataService.ts     # Chamadas ao backend
│   │   └── mockDataService.ts    # Dados mockados
│   ├── contexts/                 # Contextos (AuthContext)
│   ├── lib/
│   │   └── api.ts                # Cliente HTTP
│   └── types/                    # Tipos TypeScript
├── BackendHelpDesk/              # Backend .NET
│   ├── Controllers/              # Endpoints da API
│   ├── Services/                 # Lógica de negócio
│   ├── Models/                   # Modelos de dados
│   ├── Data/                     # Repositórios e contexto
│   └── Program.cs                # Configuração
├── .env                          # Variáveis de ambiente
├── package.json                  # Dependências Node.js
├── vite.config.ts                # Configuração Vite
└── README*.md                    # Documentação
```

## 🔐 Credenciais de Teste

### Mock (Frontend - sem backend)
```
Email: joao@empresa.com        Senha: senha123  (Colaborador)
Email: ana@suporte.com         Senha: senha123  (Técnico)
Email: carlos@admin.com        Senha: senha123  (Admin)
```

### Backend .NET
```
Login: admin                   Senha: admin123  (Admin)
Login: colab                   Senha: colab123  (Colaborador)
```

## 📦 Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm ou bun
- .NET 10 SDK (opcional - para rodar backend)

### Frontend

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview

# Lint
npm run lint
```

### Backend (Opcional)

```bash
cd BackendHelpDesk

# Restaurar dependências
dotnet restore

# Rodar
dotnet run

# Build
dotnet build

# Testes
dotnet test
```

## 🔄 Fluxo de Integração

```
┌─────────────────────┐
│   Frontend React    │
│  (http://8080)      │
└──────────┬──────────┘
           │
           │ Tenta chamar
           ▼
┌─────────────────────┐
│  Backend .NET       │
│  (http://5000)      │──── Sucesso? Use dados reais
│  (/api/...)         │
└─────────────────────┘
           │
           │ Falha ou indisponível?
           │
           ▼
┌─────────────────────┐
│  Mock Data Local    │──── Sempre funciona!
│  (mockDataService)  │
└─────────────────────┘
```

**Resultado:** ✅ Sistema nunca quebra - sempre funciona com mock como fallback!

## 🧪 Testes

```bash
# Testes de integração HTTP
node test-integration.js

# Lint frontend
npm run lint

# Build frontend (verifica erros)
npm run build
```

## 📊 Endpoints da API

### Autenticação
```
POST /api/auth/login
  { login: string, senha: string }
  → { id, nome, login, nivelAcesso }
```

### Chamados
```
GET /api/chamados                 # Listar todos
GET /api/chamados/{id}            # Obter por ID
POST /api/chamados                # Criar novo
PUT /api/chamados/{id}            # Atualizar
DELETE /api/chamados/{id}         # Deletar
GET /api/chamados/por-usuario/{id}# Listar por usuário
```

### Usuários
```
GET /api/usuarios                 # Listar todos
GET /api/usuarios/{id}            # Obter por ID
POST /api/usuarios                # Criar novo
PUT /api/usuarios/{id}            # Atualizar
DELETE /api/usuarios/{id}         # Deletar
```

## ⚙️ Configuração

### Variáveis de Ambiente (.env)

```env
# URL do backend (deixe vazio para usar apenas mock)
VITE_API_URL=http://localhost:5000

# Se definida, frontend tenta chamar backend
# Se falhar, cai automaticamente para mock
```

## 🐛 Troubleshooting

### Frontend não carrega
```bash
# Verifique se npm run dev está rodando
# Abra http://localhost:8080
# Se não funcionar, limpe cache:
rm -rf node_modules
npm install
npm run dev
```

### Erro de CORS
```bash
# Verifique VITE_API_URL em .env
# Backend deve ter CORS habilitado
# Ver TROUBLESHOOTING.md para soluções
```

### Backend não responde
```bash
# Verifique se está rodando:
# Terminal: cd BackendHelpDesk && dotnet run
# Deve estar em http://localhost:5000
# Frontend usa mock automaticamente se offline
# Ver TROUBLESHOOTING.md para debug
```

## 🚀 Deploy

### Frontend

```bash
# Build
npm run build

# Arquivos em dist/
# Deploy em: Vercel, Netlify, GitHub Pages, etc.
```

### Backend

```bash
# Publicar
dotnet publish -c Release -o ./publish

# Deploy em: Azure App Service, AWS, Heroku, etc.
```

## 🔐 Segurança

⚠️ **ATENÇÃO - Desenvolvimento Apenas**

Implementações atuais para demo/dev:
- ❌ Senhas em texto simples
- ❌ Sem JWT/Token
- ❌ CORS liberado globalmente
- ❌ Sem HTTPS

**Para Produção:**
- ✅ Hash de senhas (BCrypt, Argon2)
- ✅ JWT/OAuth 2.0
- ✅ CORS restrito
- ✅ HTTPS obrigatório
- ✅ Rate limiting
- ✅ Validação de entrada
- ✅ CSRF protection
- ✅ Logs de auditoria

## 📈 Roadmap

- [x] Integração frontend + backend
- [x] Autenticação com fallback
- [x] CRUD de chamados
- [x] Gerenciamento de usuários
- [ ] Implementar JWT
- [ ] Integração com banco de dados real
- [ ] Testes unitários e E2E
- [ ] CI/CD pipeline
- [ ] Docker & Kubernetes
- [ ] Melhorias de UX/UI
- [ ] Sistema de notificações em tempo real
- [ ] Relatórios e analytics

## 📞 Suporte

### Documentação
1. [WELCOME.txt](WELCOME.txt) - Visão geral
2. [README-INTEGRATION.md](README-INTEGRATION.md) - Integração
3. [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Problemas
4. [QUICKSTART.md](QUICKSTART.md) - Comandos rápidos

### Logs
- Frontend: DevTools (F12) → Console
- Backend: Terminal onde rodou `dotnet run`

### Erro ao Iniciar
- Verifique portas 5000 (backend) e 8080 (frontend)
- Limpe node_modules e reinstale
- Ver TROUBLESHOOTING.md

## 📄 Licença

Este projeto é fornecido como está para fins educacionais e de demonstração.

## 👥 Contribuindo

Sugestões e melhorias são bem-vindas!

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

**Desenvolvido com ❤️ | Status: ✅ Pronto para usar**

Última atualização: 11 de Novembro de 2025
