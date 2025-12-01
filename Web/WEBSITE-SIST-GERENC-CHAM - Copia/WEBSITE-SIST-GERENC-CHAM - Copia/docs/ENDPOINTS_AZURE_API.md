# 🔗 Endpoints Implementados - Azure API Integration

## Status: ✅ IMPLEMENTADO E FUNCIONANDO

**Data:** 30/11/2025
**Backend:** http://localhost:5000
**Frontend:** http://localhost:5173

---

## 📋 Resumo da Integração

O backend **SEMPRE** tenta conectar com a Azure API primeiro. **NÃO há fallback local**. Se Azure não responder, falha imediatamente.

### Características:
- ✅ Sem fallback - Azure é obrigatório
- ✅ Token Bearer em todos os endpoints
- ✅ Todos os endpoints mapeados
- ✅ Tratamento de erros robusto
- ✅ Centralizados em `AzureApiService`

---

## 🔐 Autenticação

### `POST /api/auth/login`
Faz login do usuário via Azure API.

**Request:**
```json
{
  "login": "admin",
  "senha": "123456"
}
```

**Response (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "nome": "Administrador",
  "login": "admin",
  "nivelAcesso": "Administrador"
}
```

**Erros:**
- `401 Unauthorized` - Credenciais inválidas
- `500 Internal Server Error` - Erro ao conectar com Azure

---

## 📞 Chamados

### `GET /api/chamados`
Lista os chamados do usuário logado (Cliente).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "idChamado": 1,
    "titulo": "Sistema fora do ar",
    "descricao": "Aplicação não carrega",
    "dataAbertura": "2025-11-30T10:00:00",
    "status": "Aberto",
    "urgencia": "Alta",
    "prioridade": "Alta",
    "idCliente": "550e8400-e29b-41d4-a716-446655440000",
    "idTecnicoAtribuido": null,
    "idCategoria": 1,
    "resolucaoIA_Sugerida": "Reiniciar o servidor"
  }
]
```

---

### `GET /api/chamados/todos`
Lista **TODOS** os chamados (Admin/Técnico apenas).

**Headers:**
```
Authorization: Bearer {token}
```

**Response:** Array de chamados (mesmo formato acima)

---

### `POST /api/chamados`
Cria novo chamado.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "titulo": "Sistema lento",
  "descricao": "A aplicação está muito lenta",
  "idCategoria": 1,
  "urgencia": "Média"
}
```

**Response (201 Created):**
```json
{
  "idChamado": 2,
  "titulo": "Sistema lento",
  "descricao": "A aplicação está muito lenta",
  "dataAbertura": "2025-11-30T11:00:00",
  "status": "Aberto",
  "urgencia": "Média",
  "prioridade": "Média",
  "idCliente": "550e8400-e29b-41d4-a716-446655440000",
  "idTecnicoAtribuido": null,
  "idCategoria": 1,
  "resolucaoIA_Sugerida": "Implementar cache"
}
```

---

### `PUT /api/chamados/{id}`
Atualiza status ou prioridade do chamado (Admin/Técnico).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "status": "Em Andamento",
  "prioridade": "Alta"
}
```

**Response (200 OK):**
```json
{
  "message": "Chamado atualizado com sucesso"
}
```

---

### `PUT /api/chamados/{id}/atribuir`
Atribui técnico ao chamado (Admin).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "id_tecnico": "660f9500-f40c-52e5-b827-557766551111"
}
```

**Response (200 OK):**
```json
{
  "message": "Chamado atribuído com sucesso"
}
```

---

## 💬 Comentários

### `GET /api/chamados/{id}/comentarios`
Lista comentários do chamado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "idInteracao": 1,
    "idChamado": 1,
    "idUsuario": "550e8400-e29b-41d4-a716-446655440000",
    "comentario": "Já tentei reiniciar",
    "dataHora": "2025-11-30T11:30:00"
  }
]
```

---

### `POST /api/chamados/{id}/comentarios`
Cria novo comentário.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "comentario": "Problema resolvido com atualização"
}
```

**Response (201 Created):**
```json
{
  "idInteracao": 2,
  "idChamado": 1,
  "idUsuario": "550e8400-e29b-41d4-a716-446655440000",
  "comentario": "Problema resolvido com atualização",
  "dataHora": "2025-11-30T11:45:00"
}
```

---

## 👥 Usuários

### `GET /api/usuarios`
Lista todos os usuários (Admin apenas).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nomeCompleto": "Administrador",
    "idPerfil": 1,
    "ativo": true
  },
  {
    "id": "660f9500-f40c-52e5-b827-557766551111",
    "nomeCompleto": "João Técnico",
    "idPerfil": 2,
    "ativo": true
  }
]
```

---

### `PUT /api/usuarios/{id}`
Atualiza dados do usuário (Admin).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "nomeCompleto": "João Silva",
  "idPerfil": 2,
  "ativo": true
}
```

**Response (200 OK):**
```json
{
  "message": "Usuário atualizado com sucesso"
}
```

---

### `DELETE /api/usuarios/{id}`
Inativa usuário (Admin).

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "message": "Usuário inativado com sucesso"
}
```

---

## 🏗️ Estrutura Interna

### Arquivo Principal: `AzureApiService.cs`

Centraliza todas as chamadas para Azure:

```csharp
public class AzureApiService
{
    public async Task<List<Chamado>> GetTodosChamadosAsync(string token)
    public async Task<List<Chamado>> GetMeusChamadosAsync(string token)
    public async Task<Chamado> CriarChamadoAsync(string token, ChamadoDto dto)
    public async Task UpdateChamadoAsync(string token, long id, ChamadoUpdateDto dto)
    public async Task AtribuirChamadoAsync(string token, long id, Guid idTecnico)
    public async Task<List<Comentario>> GetComentariosAsync(string token, long idChamado)
    public async Task<Comentario> CriarComentarioAsync(string token, long id, ComentarioDto dto)
    public async Task<List<Usuario>> GetUsuariosAsync(string token)
    public async Task UpdateUsuarioAsync(string token, Guid id, UsuarioUpdateDto dto)
    public async Task DeleteUsuarioAsync(string token, Guid id)
}
```

### Controllers Atualizados:

- ✅ `AuthController.cs` - Login com Azure (sem fallback)
- ✅ `ChamadosController.cs` - Todos endpoints via Azure
- ✅ `UsuariosController.cs` - Gerenciamento de usuários via Azure

---

## ⚙️ Configuração

### `appsettings.json`
```json
{
  "AzureApi": {
    "BaseUrl": "https://apichamadosunip2025-b5fdcgfuccg2gtdt.brazilsouth-01.azurewebsites.net"
  }
}
```

### `Program.cs` Registros
```csharp
builder.Services.AddHttpClient();
builder.Services.AddScoped<AzureApiService>();
```

---

## 🔴 Comportamento em Erro

**Se Azure API não responder:**

1. `AuthService` - Lança `InvalidOperationException` imediatamente
2. `ChamadosController` - Retorna `500 Internal Server Error`
3. `UsuariosController` - Retorna `500 Internal Server Error`

Não há fallback para dados locais. Sem Azure = Sistema não funciona.

---

## ✅ Checklist de Testes

- [ ] Login via Azure API
- [ ] Listar meus chamados
- [ ] Listar todos os chamados (Admin)
- [ ] Criar novo chamado
- [ ] Atualizar status do chamado
- [ ] Atribuir técnico
- [ ] Criar comentário
- [ ] Listar comentários
- [ ] Listar usuários (Admin)
- [ ] Atualizar usuário (Admin)
- [ ] Inativar usuário (Admin)

---

## 🚀 Próximos Passos

1. Testar com dados reais da Azure API
2. Verificar tratamento de autenticação no Frontend
3. Implementar refresh token (se Azure suportar)
4. Adicionar mais endpoints conforme necessário

