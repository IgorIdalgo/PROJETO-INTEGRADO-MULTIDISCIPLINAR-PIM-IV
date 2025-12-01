# Proteção de Navegação na Sidebar com Dados Não Salvos

## 📋 Resumo Executivo

Implementação de sistema robusto que detecta quando um colaborador está criando um chamado com dados não salvos e tenta navegar para outra página através da sidebar. Um alerta é exibido perguntando se deseja descartar os dados ou cancelar a navegação.

## 🎯 Objetivo

**Requisito do usuário (em português):**
> "a aplicação de quando o colaborador escreve alguma coisa e clica na side bar. não aparece a caixa de alerta. precisa aparecer, implemente esse tratamento"

**Tradução técnica:** Quando um colaborador digita dados no formulário de criação de chamado e clica em qualquer botão da sidebar para navegar para outra página, deve aparecer uma caixa de alerta perguntando se deseja descartar os dados.

## 🏗️ Arquitetura da Solução

### Camadas de Implementação

```
┌─────────────────────────────────────────────────────────────┐
│                     App.tsx (Raiz)                          │
│  - QueryClientProvider                                      │
│  - AuthProvider                                             │
│  - TooltipProvider                                          │
│  - BrowserRouter                                            │
│  - NavigationBlockerProvider (NOVO)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│             NavigationBlockerContext.tsx (Novo)             │
│  - Gerencia estado global de bloqueio de navegação          │
│  - Armazena destino pendente                                │
│  - Controla diálogo de confirmação                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────┬────────────────────┐
│  Layout.tsx      │   NewTicket.tsx    │
│  (Sidebar)       │   (Formulário)     │
│  - Intercepta    │   - Detecta dados  │
│    cliques       │   - Bloqueia nav.  │
│  - Usa contexto  │   - Mostra alerta  │
│    para navegar  │                    │
└──────────────────┴────────────────────┘
```

## 📁 Arquivos Criados/Modificados

### 1. **NavigationBlockerContext.tsx** (NOVO)
**Localização:** `src/contexts/NavigationBlockerContext.tsx`

**Responsabilidade:** Contexto React que gerencia o estado global de bloqueio de navegação

**Funcionalidades principais:**
- Armazena se navegação está bloqueada
- Armazena destino pendente para navegação
- Controla visibilidade do diálogo de confirmação
- Fornece funções de confirmação/cancelamento

**Código simplificado:**
```typescript
interface NavigationBlockerContextType {
  isNavigationBlocked: boolean;           // Se nav. está bloqueada
  blockNavigation: () => void;             // Bloqueia navegação
  unblockNavigation: () => void;           // Desbloqueia navegação
  getPendingDestination: () => string | null;  // Obtém destino
  setPendingDestination: (dest: string | null) => void;  // Define destino
  getShowConfirmDialog: () => boolean;     // Se diálogo está visível
  setShowConfirmDialog: (show: boolean) => void;  // Controla visibilidade
  confirmNavigation: () => void;           // Confirma navegação
  cancelNavigation: () => void;            // Cancela navegação
}
```

### 2. **App.tsx** (MODIFICADO)
**Localização:** `src/App.tsx`

**Mudanças:**
- Importa `NavigationBlockerProvider`
- Envolve todas as rotas com `NavigationBlockerProvider`
- **Ordem correta de provedores:**
  ```
  QueryClientProvider
    → AuthProvider
      → TooltipProvider
        → BrowserRouter
          → NavigationBlockerProvider (AQUI - dentro do Router!)
            → Routes
  ```

**Por que a ordem importa:**
- `NavigationBlockerProvider` usa `useNavigate()`
- `useNavigate()` só funciona dentro de `<BrowserRouter>`
- Se colocado fora, gera erro: "useNavigate() may be used only in the context of a <Router> component"

### 3. **Layout.tsx** (MODIFICADO)
**Localização:** `src/components/Layout.tsx`

**Mudanças principais:**

#### Importações adicionadas:
```typescript
import { useNavigationBlocker } from '../contexts/NavigationBlockerContext';
```

#### Nova função de navegação:
```typescript
const handleNavigateWithBlock = (destination: string) => {
  if (navigationBlocker.isNavigationBlocked) {
    // Se há dados não salvos, armazena destino e mostra alerta
    navigationBlocker.setPendingDestination(destination);
    navigationBlocker.setShowConfirmDialog(true);
  } else {
    // Se sem dados, navega normalmente
    navigate(destination);
  }
};
```

#### Botões da sidebar atualizados:
**Antes:**
```typescript
onClick={() => navigate('/dashboard')}
```

**Depois:**
```typescript
onClick={() => handleNavigateWithBlock('/dashboard')}
```

**Botões atualizados:**
- Dashboard: `'/`
- Meus Chamados: `'/my-tickets'`
- Base de Conhecimento: `'/knowledge-base'`
- Todos os Chamados: `'/all-tickets'`
- Gerenciar Chamados (técnico): `'/technician/manage'`
- Usuários (admin): `'/users'`
- Relatórios (admin): `'/reports'`

### 4. **NewTicket.tsx** (MODIFICADO)
**Localização:** `src/pages/NewTicket.tsx`

**Mudanças principais:**

#### Importações adicionadas:
```typescript
import { useNavigationBlocker } from "@/contexts/NavigationBlockerContext";
```

#### Hook do contexto:
```typescript
const navigationBlocker = useNavigationBlocker();
```

#### Efeito para gerenciar bloqueio:
```typescript
useEffect(() => {
  if (hasFormData()) {
    navigationBlocker.blockNavigation();  // Bloqueia se há dados
  } else {
    navigationBlocker.unblockNavigation();  // Desbloqueia se sem dados
  }
}, [title, description, category, priority, navigationBlocker]);
```

#### Handlers para confirmação/cancelamento:
```typescript
const handleExitConfirmed = () => {
  navigationBlocker.unblockNavigation();
  navigationBlocker.confirmNavigation();
  // Limpar formulário
  setTitle("");
  setDescription("");
  setCategory("");
  setPriority("");
};

const handleExitCancelled = () => {
  navigationBlocker.cancelNavigation();  // Fica na página
};
```

#### AlertDialog atualizado:
```typescript
<AlertDialog 
  open={navigationBlocker.getShowConfirmDialog()} 
  onOpenChange={navigationBlocker.setShowConfirmDialog}
>
  <AlertDialogContent className="max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle>Descartar Alterações?</AlertDialogTitle>
      <AlertDialogDescription>
        Você tem dados não salvos. Tem certeza que deseja sair? 
        Você perderá todas as informações que digitou.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={handleExitCancelled}>
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleExitConfirmed} 
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Confirmar Sair
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 🔄 Fluxo de Execução

### Cenário 1: Usuário clica na sidebar com dados não salvos

```
1. Usuário digita "Título do chamado" no campo de título
   ↓
2. useEffect detecta: hasFormData() = true
   ↓
3. navigationBlocker.blockNavigation() é chamado
   ↓
4. isNavigationBlocked = true
   ↓
5. Usuário clica em "Meus Chamados" na sidebar
   ↓
6. handleNavigateWithBlock() é acionado
   ↓
7. Detecta que isNavigationBlocked = true
   ↓
8. Armazena destino: setPendingDestination('/my-tickets')
   ↓
9. Mostra alerta: setShowConfirmDialog(true)
   ↓
10. Usuário vê: "Descartar Alterações?"
    - Opção 1: "Cancelar" → volta ao formulário, dados mantidos
    - Opção 2: "Confirmar Sair" → navega para /my-tickets, dados perdidos
```

### Cenário 2: Usuário não preencheu dados

```
1. Página carregou, todos os campos vazios
   ↓
2. hasFormData() = false
   ↓
3. navigationBlocker.unblockNavigation()
   ↓
4. isNavigationBlocked = false
   ↓
5. Usuário clica em "Meus Chamados"
   ↓
6. handleNavigateWithBlock() é acionado
   ↓
7. Detecta que isNavigationBlocked = false
   ↓
8. Navega normalmente: navigate('/my-tickets')
   ↓
9. SEM mostrar alerta
```

### Cenário 3: Usuário fecha a aba/navegador

```
1. Usuário tem dados não salvos
   ↓
2. beforeunload listener está ativo
   ↓
3. Usuário tenta fechar a aba
   ↓
4. Browser dispara evento beforeunload
   ↓
5. hasFormData() = true
   ↓
6. e.preventDefault() cancela fechamento
   ↓
7. Browser exibe aviso nativo: "Tem certeza?"
```

## ✅ Casos de Teste

### Teste 1: Navegação via sidebar com dados
**Passos:**
1. Abrir página "Novo Chamado" (NewTicket)
2. Digitar "Teste" no campo de Título
3. Clicar em "Meus Chamados" na sidebar

**Resultado esperado:**
- ✅ Alerta apareça: "Descartar Alterações?"
- ✅ Clicar "Cancelar" volta ao formulário
- ✅ Dados permanecem intactos

### Teste 2: Navegação sem dados
**Passos:**
1. Abrir página "Novo Chamado"
2. Sem preencher nada
3. Clicar em "Meus Chamados"

**Resultado esperado:**
- ✅ Navega normalmente SEM alerta

### Teste 3: Preencher múltiplos campos
**Passos:**
1. Preencher: Título, Descrição, Categoria
2. Clicar em "Base de Conhecimento"

**Resultado esperado:**
- ✅ Alerta apareça (qualquer campo preenchido dispara)

### Teste 4: Limpar dados e navegar
**Passos:**
1. Preencher Título
2. Deletar todo o Título
3. Clicar em "Dashboard"

**Resultado esperado:**
- ✅ Navega normalmente (hasFormData() = false)

### Teste 5: Fechar aba/browser
**Passos:**
1. Preencher Título
2. Fechar a aba/navegador

**Resultado esperado:**
- ✅ Browser mostra aviso nativo
- ✅ Dados não são perdidos se usuário cancelar

## 🔧 Tratamento de Erros

### Erro: "useNavigate() may be used only in the context of a <Router> component"

**Causa:** `NavigationBlockerProvider` estava fora de `BrowserRouter`

**Solução:** Mover `NavigationBlockerProvider` para **dentro** de `BrowserRouter`

**Ordem correta:**
```
BrowserRouter
  ↓
NavigationBlockerProvider (aqui!)
  ↓
Routes
```

## 📊 Fluxo de Estado

```typescript
// Estado global
navigationBlocker = {
  isNavigationBlocked: boolean,
  pendingDestination: string | null,
  showConfirmDialog: boolean
}

// Transições de estado
Initial → (usuário digita) → isNavigationBlocked = true
                          → showConfirmDialog = false

(usuário clica sidebar) → showConfirmDialog = true
                       → pendingDestination = '/my-tickets'

(usuário clica Cancelar) → showConfirmDialog = false
                        → pendingDestination = null
                        → fica na página

(usuário clica Sair) → confirmNavigation()
                    → navigate(pendingDestination)
                    → formulário limpo
                    → isNavigationBlocked = false
```

## 💡 Decisões de Design

### 1. Por que usar Contexto e não Redux?
- Redux seria overkill para um estado simples
- Contexto é nativo do React
- Menor overhead de dependências

### 2. Por que callbacks no contexto?
- Permite que o Layout controle a navegação sem conhecer o NewTicket
- Separação de responsabilidades
- Reutilizável em outras páginas com formulários

### 3. Por que `getShowConfirmDialog()` em vez de expor diretamente?
- Encapsulamento do estado
- Permite mudanças futuras no armazenamento

### 4. Por que manter `beforeunload` listener?
- Cobre caso de fechar aba/browser
- Complementa proteção de sidebar
- Redundância de segurança

## 🚀 Funcionalidades Futuras

- [ ] Estender proteção a outras páginas com formulários
- [ ] Salvar rascunho automaticamente
- [ ] Sincronizar com localStorage para recuperação de dados
- [ ] Animação suave para o alerta
- [ ] Som de alerta (opcional)
- [ ] Timeout auto-dismiss

## 📝 Sumário de Mudanças

| Arquivo | Tipo | Mudança |
|---------|------|---------|
| `src/contexts/NavigationBlockerContext.tsx` | CRIADO | Novo contexto de bloqueio |
| `src/App.tsx` | MODIFICADO | Envolveu app com provider |
| `src/components/Layout.tsx` | MODIFICADO | Função de navegação com bloco |
| `src/pages/NewTicket.tsx` | MODIFICADO | Integrou contexto e alerta |

## ✨ Status da Implementação

**CONCLUÍDO ✅**
- Contexto criado e funcional
- Layout intercepta cliques de sidebar
- NewTicket bloqueia navegação quando há dados
- Alerta exibido corretamente
- Testes manuais passando
- Sem erros de console

## 📞 Troubleshooting

**Alerta não aparece?**
- Verificar se `navigationBlocker.blockNavigation()` foi chamado
- Verificar se dados são detectados por `hasFormData()`
- Verificar console para erros

**Erro "useNavigate may be used only in the context of <Router>"?**
- Verificar ordem de provedores em App.tsx
- `NavigationBlockerProvider` deve estar **dentro** de `BrowserRouter`

**Navegação travada?**
- Verificar se `unblockNavigation()` foi chamado após sair da página
- Verificar se `handleExitConfirmed()` limpa formulário

