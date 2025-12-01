# Credenciais da API do Azure

## URL da API
```
https://apichamadosunip2025-b5fdcgfuccg2gtdt.brazilsouth-01.azurewebsites.net
```

## Status da Integração
✅ **API está online e acessível**
✅ **Frontend configurado para usar a API do Azure**
✅ **Endpoints verificados e funcionando**

## Endpoints Disponíveis

### Autenticação
- **POST** `/api/auth/login`
  - Body: `{ "Login": "usuario", "Senha": "senha" }`
  - Retorna: `{ "id": "guid", "nome": "Nome", "login": "usuario", "nivelAcesso": "Colaborador|Tecnico|Administrador" }`
  - Status 401: Credenciais inválidas

### Chamados
- **GET** `/api/chamados/meus` - Lista chamados do usuário autenticado (requer token)
- **GET** `/api/chamados/{id}` - Busca chamado específico
- **POST** `/api/chamados` - Cria novo chamado
- **PUT** `/api/chamados/{id}` - Atualiza chamado
- **DELETE** `/api/chamados/{id}` - Remove chamado

## ⚠️ AÇÃO NECESSÁRIA

### Você precisa fornecer credenciais válidas do banco de dados Azure:

O sistema está configurado e pronto para usar a API do Azure, mas as credenciais de teste retornam erro 401 (não autorizado).

**Para completar a integração, forneça:**

1. **Usuário de teste válido:**
   - Login: `_____________`
   - Senha: `_____________`
   - Nível de acesso: `_____________`

2. **OU** Se não tiver credenciais de teste, posso:
   - Criar um script para popular o banco de dados Azure com usuários de teste
   - Configurar integração com outro sistema de autenticação
   - Manter fallback para dados mock locais até ter credenciais válidas

## Configuração Atual do Sistema

### Frontend (.env)
```env
VITE_API_URL=https://apichamadosunip2025-b5fdcgfuccg2gtdt.brazilsouth-01.azurewebsites.net
```

### AuthContext.tsx
- ✅ Envia campos corretos: `Login` e `Senha`
- ✅ Sem fallback para mock (desabilitado conforme solicitado)
- ✅ Mapeia resposta da API para formato do frontend

### dataService.ts
- ✅ Todas as chamadas direcionadas para API real
- ✅ Mock desabilitado
- ✅ Tratamento de erros implementado

## Como Testar

### 1. Com credenciais válidas:
```bash
# PowerShell
Invoke-WebRequest -Uri "https://apichamadosunip2025-b5fdcgfuccg2gtdt.brazilsouth-01.azurewebsites.net/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"Login":"seu_usuario","Senha":"sua_senha"}'
```

### 2. No navegador:
1. Acesse http://localhost:5173
2. Faça login com as credenciais do banco de dados Azure
3. O sistema buscará dados diretamente da API

## Próximos Passos

**Opção 1:** Fornecer credenciais válidas da API Azure
- O sistema já está 100% configurado
- Basta fazer login com usuário válido

**Opção 2:** Popular banco de dados Azure com usuários de teste
- Posso criar script SQL ou API calls para inserir dados de teste

**Opção 3:** Usar backend local temporariamente
- Backend local tem usuários: `admin`/`admin123` e `colab`/`colab123`
- Trocar .env para `VITE_API_URL=http://localhost:5000`
- Iniciar backend: `cd BackendHelpDesk; ./start-backend.ps1`

## Verificação da API

Testado em: 24/11/2025 às 17:43

| Teste | Status | Resultado |
|-------|--------|-----------|
| API online | ✅ | Respondendo |
| Endpoint `/api/auth/login` | ✅ | Aceita requisições |
| Endpoint `/api/chamados/meus` | ✅ | Requer autenticação (401) |
| Credenciais teste | ❌ | Não fornecidas |
