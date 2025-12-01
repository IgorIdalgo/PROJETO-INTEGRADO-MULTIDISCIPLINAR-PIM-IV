# 🤖 Onde Vem a Sugestão da IA?

**Rastreamento completo do fluxo de "AI Suggestions" no sistema**

---

## 📍 Localização no Código

### 1. **Página de Criar Chamado** (Frontend)
**Arquivo**: `src/pages/NewTicket.tsx`

```tsx
// Linha 19: Importa a função de sugestões
import { getAISuggestions, createTicket } from "@/services/mockDataService";

// Linha 58: Chama a função quando usuário clica em "Analisar Problema"
const analyzeProblem = async () => {
  if (!description || description === analyzedDescription) return;
  
  setIsAnalyzing(true);
  try {
    const aiSuggestions = await getAISuggestions(description);  // ← AQUI!
    setSuggestions(aiSuggestions);
    setAnalyzedDescription(description);
  } catch (error) {
    console.error("Error analyzing problem:", error);
  } finally {
    setIsAnalyzing(false);
  }
};
```

---

## 🔄 Fluxo de Requisição

```
┌──────────────────────────────────────────────────────────────┐
│ FRONTEND: NewTicket.tsx                                      │
│                                                              │
│ 1. Usuário digita descrição do problema                     │
│ 2. Clica em "Analisar Problema com IA" 🔘                   │
│ 3. Chama analyzeProblem()                                    │
│ 4. Chama getAISuggestions(description)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ SERVICE LAYER: src/services/                                │
│                                                              │
│ A. dataService.ts (Adaptador)                               │
│    └─ Tenta backend PRIMEIRO:                               │
│       - Chama apiDataService.getAISuggestions()             │
│       - Backend lança: "Not implemented on backend"         │
│       - Cai para MOCK (fallback automático)                 │
│                                                              │
│ B. mockDataService.ts (EXECUTADO)                           │
│    ✅ getAISuggestions(query: string)                        │
│    └─ Processa a query LOCAL                                │
│    └─ Retorna sugestões baseadas em KEYWORDS               │
└──────────────────────────────────────────────────────────────┘
```

---

## 🧠 Implementação da IA (MOCK)

### Arquivo: `src/services/mockDataService.ts` (Linhas 337+)

**Como funciona:**

A IA analisa a descrição do problema e busca por **keywords**. Se encontra uma match, retorna sugestões:

```typescript
export const getAISuggestions = (query: string): Promise<AISuggestion[]> => {
  const suggestions: AISuggestion[] = [];
  
  // 1. Se a query menciona "impressora" ou "printer"
  if (query.toLowerCase().includes("impressora") || query.toLowerCase().includes("printer")) {
    suggestions.push({
      id: "sugest-1",
      title: "Como resolver atolamento de papel em impressoras HP LaserJet",
      summary: "Guia passo a passo para solucionar problemas...",
      confidence: 0.89,  // Confiança: 89%
      articleId: "kb1",
      articleUrl: "/knowledge-base/kb1"
    });
  }
  
  // 2. Se a query menciona "excel" ou "arquivo"
  if (query.toLowerCase().includes("excel") || query.toLowerCase().includes("arquivo")) {
    suggestions.push({
      id: "sugest-2",
      title: "Corrigindo erros comuns do Microsoft Excel",
      summary: "Soluções para problemas ao abrir arquivos...",
      confidence: 0.78,
      articleId: "kb2",
      articleUrl: "/knowledge-base/kb2"
    });
  }
  
  // 3. Se menciona "monitor", "hardware", "equipamento", "solicita"
  if (query.toLowerCase().includes("monitor") || 
      query.toLowerCase().includes("hardware") || 
      query.toLowerCase().includes("equipamento") || 
      query.toLowerCase().includes("solicita")) {
    suggestions.push({
      id: "sugest-3",
      title: "Solicitação de novos equipamentos: Processo e políticas",
      summary: "Como solicitar novos equipamentos...",
      confidence: 0.85,
      articleId: "kb3",
      articleUrl: "/knowledge-base/kb3"
    });
  }
  
  // ... mais keywords
  
  return Promise.resolve(suggestions);
};
```

---

## 🎯 Keywords Detectados (Atuais)

| Keyword | Retorna Artigo |
|---------|-----------------|
| `impressora`, `printer` | HP LaserJet - Atolamento de Papel |
| `excel`, `arquivo` | Erros do Microsoft Excel |
| `monitor`, `hardware`, `equipamento`, `solicita` | Solicitação de Equipamentos |
| `email`, `outlook` | Problemas de Email |
| `wifi`, `rede`, `internet`, `conexão` | Conexão de Rede |
| `senha`, `acesso`, `login` | Reset de Senha |
| `virus`, `segurança`, `malware` | Segurança e Proteção |
| `atualizar`, `update`, `versão` | Atualizações de Software |

---

## 📊 Fluxo Completo (Diagrama)

```
┌─ NewTicket.tsx ─────────────────────────────────────────────┐
│                                                             │
│  Usuário: "Minha impressora está travada com papel"        │
│                    │                                       │
│                    ▼                                       │
│         analyzeProblem()                                   │
│                    │                                       │
│                    ▼                                       │
│  await getAISuggestions(description)                       │
│         (importado de mockDataService)                     │
│                    │                                       │
└────────────────────┼───────────────────────────────────────┘
                     │
                     ▼
     ┌─ dataService.ts ─────────────────┐
     │                                 │
     │ tryApiOrMock(apiFunc, mockFunc) │
     │                                 │
     │ 1. Tenta API (não implementado) │
     │ 2. Cai para MOCK ← AQUI!       │
     │                                 │
     └────────────┬────────────────────┘
                  │
                  ▼
     ┌─ mockDataService.ts ──────────┐
     │                              │
     │ Procura keywords em:         │
     │ "impressora" ✓ ENCONTRADO!   │
     │                              │
     │ Retorna 1 sugestão:          │
     │ {                            │
     │   id: "...",                 │
     │   title: "Como resolver...",│
     │   confidence: 0.89,          │
     │   ...                        │
     │ }                            │
     └────────────┬─────────────────┘
                  │
                  ▼
     ┌─ NewTicket.tsx ──────────────┐
     │                              │
     │ setSuggestions(aiSugg...)    │
     │                              │
     │ Renderiza na UI:             │
     │ 💡 Sugestão 1                │
     │ "HP LaserJet - Atolamento"   │
     │                              │
     └──────────────────────────────┘
```

---

## 🔌 Backend (Não Implementado)

**Arquivo**: `src/services/apiDataService.ts` (Linha 138)

```typescript
// Backend NÃO tem endpoint para IA
export const getAISuggestions = async (query: string): Promise<AISuggestion[]> => {
  throw new Error('Not implemented on backend');  // ← Força fallback para mock
};
```

**Por quê não está no backend?**
1. ✅ Demo/MVP — apenas para demonstração
2. ✅ Para integrar com IA real (OpenAI, etc.) seria necessário:
   - API key do OpenAI/Azure/etc.
   - Implementar chamada HTTP no backend
   - Tratar rate limits e custos

---

## 🎨 UI Components (Onde é Exibido)

**Arquivo**: `src/pages/NewTicket.tsx` (Linhas ~150+)

```tsx
{suggestions.length > 0 && (
  <Card className="border-amber-200 bg-amber-50">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-amber-600" />
        Sugestões da IA
      </CardTitle>
      <CardDescription>
        Com base na sua descrição, encontramos artigos da base de conhecimento que podem ajudar
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.id}
          onClick={() => navigate(suggestion.articleUrl)}
          className="w-full text-left p-3 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold text-sm">{suggestion.title}</p>
              <p className="text-xs text-gray-600 mt-1">{suggestion.summary}</p>
            </div>
            <span className="text-xs bg-amber-200 px-2 py-1 rounded">
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>
        </button>
      ))}
    </CardContent>
  </Card>
)}
```

---

## 📈 Resumo da Arquitetura de IA

| Camada | O Que Faz | Status |
|--------|----------|--------|
| **Frontend (NewTicket.tsx)** | Recebe input do usuário, chama getAISuggestions() | ✅ Pronto |
| **Adapter (dataService.ts)** | Tenta backend, cai para mock | ✅ Pronto |
| **Mock (mockDataService.ts)** | Análise LOCAL com keyword matching | ✅ Pronto |
| **Backend (apiDataService.ts)** | Não implementado (lança erro) | ❌ Não feito |
| **Real Backend API** | Não existe endpoint em `/api/ai` | ❌ Não existe |

---

## 🚀 Como Integrar com IA Real (Opcional)

Se quiser usar IA real (OpenAI, Azure, etc.):

### Backend (.NET)

```csharp
// Novo controller: AIController.cs
[ApiController]
[Route("api/ai")]
public class AIController : ControllerBase
{
    [HttpPost("analyze")]
    public async Task<IActionResult> AnalyzeProblem([FromBody] AnalysisRequest req)
    {
        // 1. Chamar OpenAI API
        var suggestions = await _aiService.GetSuggestions(req.description);
        
        // 2. Retornar resultado
        return Ok(suggestions);
    }
}
```

### Frontend

```typescript
// Atualizar apiDataService.ts
export const getAISuggestions = async (query: string): Promise<AISuggestion[]> => {
  const resp = await apiPost('/api/ai/analyze', { description: query });
  return resp.suggestions || [];
};
```

---

## 📝 Conclusão

**De onde vem a sugestão da IA?**

✅ **Da descrição do problema + análise LOCAL de keywords**

1. Usuário digita um problema (ex: "impressora travada")
2. Clica em "Analisar"
3. Frontend chama `getAISuggestions(description)`
4. Sistema tenta backend (não existe)
5. Cai para MOCK em `mockDataService.ts`
6. MOCK procura por keywords na descrição
7. Se encontra match, retorna artigos da base de conhecimento com % de confiança
8. UI exibe sugestões com links para KnowledgeBase

**Atualmente é uma "IA" de MOCK usando pattern matching simples.**  
**Para IA real, seria necessário integrar com OpenAI, Azure, etc.**
