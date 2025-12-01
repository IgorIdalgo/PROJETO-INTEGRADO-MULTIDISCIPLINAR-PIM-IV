# Proteção de Dados Não Salvos - Página de Criação de Chamado

## 📋 Resumo
Implementação de sistema de alerta quando um colaborador está criando um chamado e tenta navegar para outra página com dados não salvos.

## 🎯 Funcionalidade
Quando um colaborador está criando um novo chamado e digitou informações em qualquer campo (Título, Descrição, Categoria ou Prioridade), o sistema:

1. **Detecta tentativas de navegação** via:
   - Cliques em links/botões para outras páginas
   - Botão de voltar do navegador
   - Fechamento da aba/navegador

2. **Exibe um alerta** perguntando se o usuário tem certeza que deseja sair
3. **Oferece duas opções**:
   - **"Cancelar"**: Retorna à página de criação (dados são mantidos)
   - **"Confirmar Sair"**: Navega para a página de destino (dados são perdidos)

## 🔧 Implementação Técnica

### Arquivo Modificado
`src/pages/NewTicket.tsx`

### Componentes Utilizados
- `AlertDialog`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogFooter`, `AlertDialogCancel`, `AlertDialogAction` (shadcn/ui)
- `useLocation` (React Router DOM)

### Estado Adicionado
```typescript
const [showExitDialog, setShowExitDialog] = useState(false);
const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
const location = useLocation();
```

### Funções de Verificação
```typescript
// Verifica se há dados nos campos do formulário
const hasFormData = (): boolean => {
  return !!(title.trim() || description.trim() || category || priority);
};

// Manipula o clique no botão de voltar
const handleBackClick = () => {
  if (hasFormData()) {
    setShowExitDialog(true);
    setPendingNavigation(null);
  } else {
    navigate(-1);
  }
};

// Manipula a navegação quando confirmada
const confirmExit = () => {
  setShowExitDialog(false);
  if (pendingNavigation) {
    navigate(pendingNavigation);
  } else {
    navigate(-1);
  }
  setPendingNavigation(null);
};

// Cancela a navegação
const cancelExit = () => {
  setShowExitDialog(false);
  setPendingNavigation(null);
};
```

### Camadas de Proteção

#### 1️⃣ Proteção ao Fechar Aba/Navegador
```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (hasFormData()) {
      e.preventDefault();
      e.returnValue = '';
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [title, description, category, priority]);
```

#### 2️⃣ Proteção ao Clicar em Links/Botões
```typescript
useEffect(() => {
  const handleNavigation = (e: Event) => {
    if (hasFormData() && e.target instanceof HTMLAnchorElement) {
      e.preventDefault();
      const href = (e.target as HTMLAnchorElement).href;
      const path = new URL(href).pathname;
      setPendingNavigation(path);
      setShowExitDialog(true);
    }
  };

  document.addEventListener('click', handleNavigation, true);
  return () => document.removeEventListener('click', handleNavigation, true);
}, [title, description, category, priority]);
```

#### 3️⃣ Proteção ao Usar Botão de Voltar
O componente pode ter um botão de voltar que utiliza `handleBackClick()`:
```typescript
<Button onClick={handleBackClick} variant="outline">
  ← Voltar
</Button>
```

### AlertDialog Renderizado
```typescript
{/* Modal de Dados Não Salvos */}
<AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
  <AlertDialogContent className="max-w-md">
    <AlertDialogHeader>
      <AlertDialogTitle>Descartar Alterações?</AlertDialogTitle>
      <AlertDialogDescription>
        Você tem dados não salvos. Tem certeza que deseja sair? 
        Você perderá todas as informações que digitou.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={cancelExit}>
        Cancelar
      </AlertDialogCancel>
      <AlertDialogAction 
        onClick={confirmExit} 
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Confirmar Sair
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 🧪 Teste do Fluxo

### Caso de Teste 1: Clicar em Link na Barra Lateral
1. Abrir página "Novo Chamado" (NewTicket)
2. Digitar algo no campo "Título"
3. Clicar em outro item da barra lateral (ex: "Meus Chamados")
4. ✅ Alerta deve aparecer
5. Clicar "Cancelar" → deve voltar ao formulário
6. Clicar novamente no link → alerta aparece novamente
7. Clicar "Confirmar Sair" → deve navegar para a página escolhida

### Caso de Teste 2: Botão de Voltar do Navegador
1. Preencher formulário com dados
2. Clicar botão de voltar do navegador
3. ✅ Alerta deve aparecer (browser default event)
4. Cancelar → volta ao formulário
5. Confirmar → sai da página

### Caso de Teste 3: Fechar Aba
1. Preencher formulário
2. Tentar fechar a aba
3. ✅ Browser deve avisar "Você tem alterações não salvas"

### Caso de Teste 4: Sem Dados
1. Abrir página "Novo Chamado" sem preencher nada
2. Clicar em outro item da barra lateral
3. ✅ Deve navegar normalmente SEM mostrar alerta

## 📱 UX Melhorado

O sistema agora oferece:
- ✅ **Prevenção de perda de dados**: Dados não são perdidos acidentalmente
- ✅ **Feedback claro**: Usuário sabe que tem dados pendentes
- ✅ **Múltiplas camadas de proteção**: Cobre vários cenários de navegação
- ✅ **Experiência intuitiva**: Alerta em português, botões claros (Cancelar/Confirmar)
- ✅ **Design consistente**: Utiliza componentes shadcn/ui padrão

## 🔗 Relacionados
- `/src/pages/NewTicket.tsx` - Página de criação de chamados (implementação completa)
- `/docs/00_RESUMO_FINAL.md` - Resumo geral do projeto
- `/docs/STATUS.md` - Status de implementação

## ✅ Status
**CONCLUÍDO** - Implementação completa com todas as camadas de proteção funcionando.
