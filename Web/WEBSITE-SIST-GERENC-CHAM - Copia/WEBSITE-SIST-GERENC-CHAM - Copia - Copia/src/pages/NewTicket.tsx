
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigationBlocker } from "@/contexts/NavigationBlockerContext";
import { useToast } from "@/hooks/use-toast";
import { gerarSugestoesLocalizada, extrairKeywords } from "@/lib/aiSuggestions";
import { buscarArticosRelatados } from "@/services/knowledgeBaseService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { apiPost, apiGet } from "@/lib/api";
import { TicketCategory, TicketPriority, TicketStatus, UserRole } from "@/types";
import { AlertCircle, Loader2, Bot, Sparkles, ExternalLink, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function NewTicket() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Aqui, ele verifica se o usuário é administrador
  if (user?.role === UserRole.ADMINISTRATOR) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Administradores não têm permissão para criar chamados.
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate('/dashboard')} 
          className="mt-4"
        >
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [priority, setPriority] = useState<TicketPriority | "">("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdTicketId, setCreatedTicketId] = useState<string>("");
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [allFieldsFilled, setAllFieldsFilled] = useState(false);
  const [aiSuggestionText, setAiSuggestionText] = useState("");
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const location = useLocation();
  const navigationBlocker = useNavigationBlocker();

  const hasFormData = () => {
    return title.trim() !== "" || description.trim() !== "" || category !== "" || priority !== "";
  };

  // Verificar se todos os campos estão preenchidos
  useEffect(() => {
    const filled = title.trim() !== "" && description.trim() !== "" && category !== "" && priority !== "";
    setAllFieldsFilled(filled);
  }, [title, description, category, priority]);

  // Gerenciar bloqueio de navegação
  useEffect(() => {
    if (hasFormData()) {
      navigationBlocker.blockNavigation();
    } else {
      navigationBlocker.unblockNavigation();
    }
  }, [title, description, category, priority, navigationBlocker]);

  // Precaução para evitar perda de dados ao fechar a aba ou navegador
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

  const handleBackClick = () => {
    if (hasFormData()) {
      navigationBlocker.setShowConfirmDialog(true);
      navigationBlocker.setPendingDestination(null);
    } else {
      navigate(-1);
    }
  };

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
    navigationBlocker.cancelNavigation();
  };

  const handleSuggestionHelped = () => {
    setShowFeedbackDialog(false);
    toast({
      title: "🎉 Ótimo!",
      description: "Que bom que conseguimos resolver seu problema! Não é necessário abrir um chamado.",
    });
    // Limpar formulário e voltar
    setTimeout(() => {
      navigate('/dashboard');
    }, 1500);
  };

  const handleSuggestionDidNotHelp = () => {
    setShowFeedbackDialog(false);
    toast({
      title: "😔 Que pena!",
      description: "Não se preocupe, você pode abrir o chamado e um técnico irá atendê-lo em breve.",
    });
  };

  // Função para buscar sugestões da IA via API
  const fetchAISuggestions = async (descricao: string) => {
    if (!descricao || descricao.trim().length < 20) {
      setAiSuggestions([]);
      return;
    }

    setIsAnalyzing(true);
    try {
      // 1. Gera sugestões localizadas baseadas em keywords
      const sugestoesIA = gerarSugestoesLocalizada(descricao);
      
      // 2. Extrai keywords para buscar artigos
      const keywords = extrairKeywords(descricao);
      const keywordStrings = keywords.slice(0, 5).map(k => k.keyword);
      const tiposProblema = keywords.map(k => k.tipoProblema);

      // 3. Busca artigos relacionados da base de conhecimento
      const articosRelacionados = await buscarArticosRelatados(keywordStrings, tiposProblema);

      // 4. Combina sugestões de IA com artigos
      const sugestoesCompletas = sugestoesIA.map((sugestao, idx) => ({
        id: sugestao.id,
        titulo: sugestao.titulo,
        resumo: sugestao.resumo,
        descricao: sugestao.descricao,
        passos: sugestao.passos,
        confianca: Math.round(sugestao.confianca * 100),
        tipoProblema: sugestao.tipoProblema,
        artigos: articosRelacionados.slice(idx, idx + 1) // Cada sugestão pode ter um artigo
      }));

      setAiSuggestions(sugestoesCompletas);

      // 5. Formata sugestões em texto para enviar ao backend
      if (sugestoesCompletas.length > 0) {
        const suggestionsText = sugestoesCompletas
          .map((s: any, idx: number) => {
            let texto = `${idx + 1}. ${s.titulo} (${s.confianca}% relevante)\n   ${s.resumo}`;
            
            // Adiciona artigos da base de conhecimento se existirem
            if (s.artigos && s.artigos.length > 0) {
              texto += `\n   📚 Artigo relacionado: ${s.artigos[0].titulo}`;
            }
            
            return texto;
          })
          .join('\n\n');
        
        setAiSuggestionText(`✅ Encontrei algumas sugestões que podem ajudar:\n\n${suggestionsText}`);
      } else {
        setAiSuggestionText('');
      }
    } catch (error: any) {
      console.error('Erro ao buscar sugestões:', error);
      setAiSuggestions([]);
      setAiSuggestionText('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Debounce para evitar chamadas excessivas à API
  useEffect(() => {
    const timer = setTimeout(() => {
      if (description.trim().length >= 20) {
        fetchAISuggestions(description);
      } else {
        setAiSuggestions([]);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [description]);

  const palavrasProibidas = [
        'marmita', 'comida', 'almoço', 'café', 'lanche', 'roubada', 'roubado', 'roubo',
        'carteira', 'dinheiro', 'celular pessoal', 'carro', 'estacionamento', 'banheiro',
        'ar condicionado', 'temperatura', 'limpeza', 'elevador', 'porta', 'janela',
        'cadeira', 'mesa', 'café da manhã', 'água', 'bebida', 'pão', 'bolo', 'pizza',
        'pizza', 'refrigerante', 'suco', 'doce', 'açúcar', 'sal', 'pimenta', 'molho',
        'tempero', 'receita', 'cozinha', 'fogão', 'forno', 'geladeira', 'freezer',
        'microondas', 'panela', 'prato', 'copo', 'garfo', 'faca', 'colher', 'navio',
        'barco', 'carro', 'bicicleta', 'moto', 'ônibus', 'trem', 'avião', 'helicóptero',
        'telefone pessoal', 'smartphone', 'tablet pessoal', 'jogo', 'diversão', 'cinema',
        'teatro', 'música', 'canção', 'filme', 'série', 'novela', 'futebol', 'voleibol',
        'basquete', 'ténis', 'natação', 'corrida', 'academia', 'ginástica', 'yoga',
        'meditação', 'namoro', 'casamento', 'divórcio', 'relacionamento', 'amizade',
        'briga', 'discussão', 'conflito pessoal', 'vizinho', 'amigo', 'família',
        'viajem', 'férias', 'turismo', 'praia', 'montanha', 'rio', 'lago', 'floresta',
        'hotel', 'resort', 'pousada', 'camping', 'roupa', 'sapato', 'bolsa', 'jaqueta',
        'calça', 'camiseta', 'meia', 'chapéu', 'óculos pessoal', 'relógio', 'joias',
        'anéis', 'pulseiras', 'colares', 'brincos', 'perfume', 'sabonete', 'shampoo',
        'condicionador', 'escova', 'pente', 'espelho', 'toalha', 'cortina', 'carpete',
        'tapete', 'quadro', 'foto', 'espelho', 'abajur', 'vela', 'incenso',
        'pet', 'cachorro', 'gato', 'pássaro', 'peixe', 'hamster', 'coelho',
        'criança', 'bebê', 'gravidez', 'parto', 'amamentação', 'fraldas',
        'brinquedo', 'lego', 'bola', 'boneca', 'carrinho', 'videogame', 'playstation',
        'xbox', 'nintendo', 'console', 'controle', 'joystick', 'mouse gamer', 'teclado gamer',
        'fone pessoal', 'fone de ouvido pessoal', 'headphone', 'alto-falante',
        'enchente', 'tempestade', 'furacão', 'tornado', 'chuva', 'neve', 'granizo',
        'terremoto', 'desastre', 'acidente', 'incêndio', 'explosão', 'vazamento'
      ];

  // Palavras-chave de TI que devem estar presentes
  const palavrasObrigatoriasTI = [
        'computador', 'pc', 'laptop', 'notebook', 'desktop', 'servidor', 'rede', 'internet',
        'wifi', 'conexão', 'vpn', 'email', 'outlook', 'gmail', 'software', 'programa',
        'aplicativo', 'app', 'sistema', 'windows', 'mac', 'linux', 'android', 'ios',
        'impressora', 'scanner', 'multifuncional', 'copier', 'fax', 'telefone ip',
        'câmera', 'monitor', 'tela', 'teclado', 'mouse', 'webcam', 'microfone',
        'caixa', 'processador', 'memória', 'disco', 'ssd', 'pendrive', 'usb',
        'firewall', 'antivírus', 'backup', 'sincronização', 'cloud', 'nuvem',
        'erro', 'bug', 'crash', 'lentidão', 'travamento', 'congelamento',
        'atualização', 'instalação', 'desinstalação', 'driver', 'firmware',
        'permissão', 'acesso', 'senha', 'autenticação', 'login', 'usuário',
        'suporte', 'helpdesk', 'chamado', 'ticket', 'problema técnico', 'issue',
        'arquivo', 'pasta', 'documento', 'planilha', 'apresentação', 'pdf',
        'banco de dados', 'sql', 'servidor web', 'apache', 'nginx', 'iis',
        'html', 'css', 'javascript', 'python', 'java', 'c#', 'php', 'ruby',
        'git', 'github', 'repositório', 'código', 'desenvolvimento', 'programação',
        'site', 'aplicação', 'portal', 'plataforma', 'interface', 'usuário',
        'onedrive', 'sharepoint', 'teams', 'skype', 'microsoft 365', 'office 365',
        'vpn', 'dados', 'informação', 'segurança', 'criptografia', 'token',
        'acl', 'permissão', 'grupo', 'domínio', 'active directory', 'ldap',
        'dns', 'dhcp', 'ip', 'gateway', 'proxy', 'roteador', 'switch', 'hub',
        'modem', 'hub', 'cabo', 'ethernet', 'fibra', 'óptica', '5g', '4g', 'lte'
      ];

  // Função para validar se o conteúdo é relacionado a TI
  const validarConteudoTI = (texto: string): { valido: boolean; mensagem: string } => {
    const textoLowerCase = texto.toLowerCase().trim();
    
    if (!textoLowerCase) {
      return { valido: false, mensagem: 'Por favor, descreva o problema.' };
    }

    // Verificar se contém palavras proibidas
    for (const palavra of palavrasProibidas) {
      const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
      if (regex.test(textoLowerCase)) {
        return { 
          valido: false, 
          mensagem: `❌ Esse chamado não parece ser relacionado a TI. Por favor, descreva um problema técnico.` 
        };
      }
    }

    // Verificar se contém pelo menos uma palavra-chave de TI
    let contemPalavrasTI = false;
    for (const palavra of palavrasObrigatoriasTI) {
      const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
      if (regex.test(textoLowerCase)) {
        contemPalavrasTI = true;
        break;
      }
    }

    if (!contemPalavrasTI) {
      return { 
        valido: false, 
        mensagem: `❌ Não identifiquei termos técnicos. Descreva um problema de TI (computador, rede, software, impressora, etc.).` 
      };
    }

    return { valido: true, mensagem: '' };
  };

  const handleOpenSuggestionDetail = (suggestion: any) => {
    setSelectedSuggestion(suggestion);
    setShowSuggestionModal(true);
  };

  const handleCloseSuggestionModal = () => {
    setShowSuggestionModal(false);
    setSelectedSuggestion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !description || !category || !priority) {
      toast({
        title: "Campos incompletos",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // Validar se o conteúdo é relacionado a TI
    const validacaoTitulo = validarConteudoTI(title);
    const validacaoDescricao = validarConteudoTI(description);

    if (!validacaoTitulo.valido) {
      toast({
        title: "Título Inválido",
        description: validacaoTitulo.mensagem,
        variant: "destructive",
      });
      return;
    }

    if (!validacaoDescricao.valido) {
      toast({
        title: "Descrição Inválida",
        description: validacaoDescricao.mensagem,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!user) throw new Error("Usuário não autenticado");

      // Mapear prioridade (UI) -> urgência (API)
      const urgenciaMap: Record<string, string> = {
        [TicketPriority.LOW]: 'Baixa',
        [TicketPriority.MEDIUM]: 'Média',
        [TicketPriority.HIGH]: 'Alta',
      };

      // Mapear categoria (UI) -> id_categoria (API)
      const categoriaIdMap: Record<string, number> = {
        [TicketCategory.HARDWARE]: 1,
        [TicketCategory.SOFTWARE]: 2,
        [TicketCategory.NETWORK]: 3,
        [TicketCategory.PRINTER]: 4,
      };

      // Mapear status para ID (Aberto = 1)
      const statusMap: Record<string, number> = {
        [TicketStatus.OPEN]: 1,
      };

      const payload = {
        titulo: title,
        descricao: description,
        id_categoria: categoriaIdMap[category] ?? 0,
        urgencia: urgenciaMap[priority] ?? 'Média',
        status: TicketStatus.OPEN, // Status automático: Aberto
        id_status: statusMap[TicketStatus.OPEN], // ID do status: 1 (Aberto)
        sugestaoIAEnviada: aiSuggestionText || null,
      };

      console.log('=== CRIANDO CHAMADO ===');
      console.log('Priority original:', priority);
      console.log('Urgência mapeada:', urgenciaMap[priority]);
      console.log('Category original:', category);
      console.log('Categoria ID mapeada:', categoriaIdMap[category]);
      console.log('Payload completo:', payload);

      const newTicket = await apiPost('/api/chamados', payload);

      console.log('Chamado criado:', newTicket);

      const ticketId = newTicket.idChamado || newTicket.IdChamado || newTicket.id_chamado || newTicket.id;
      setCreatedTicketId(ticketId);
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Erro ao criar chamado:", error);
      toast({
        title: "Erro ao criar chamado",
        description: "Ocorreu um erro ao tentar criar o chamado. Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessModal(false);
    navigate('/my-tickets');
  };

  return (
    <>
      {/* Modal de Dados Não Salvos */}
      <AlertDialog open={navigationBlocker.getShowConfirmDialog()} onOpenChange={navigationBlocker.setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar Alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem dados que não foram salvos. Tem certeza que deseja sair? Você perderá todas as informações que digitou.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleExitCancelled}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleExitConfirmed} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Sucesso */}
      <AlertDialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-3 animate-bounce">
                <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
              <AlertDialogTitle className="text-center text-xl">
                Chamado Criado com Sucesso!
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-center space-y-3">
              <div className="mt-4">
                <p className="text-lg font-semibold text-foreground">
                  Chamado #{createdTicketId}
                </p>
                <p className="mt-2 text-sm">
                  Seu chamado foi registrado e será atendido em breve por um de nossos técnicos.
                </p>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  🔔 Você receberá notificações sobre o andamento do seu chamado.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSuccessConfirm} className="w-full">
              Ver Meus Chamados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Sugestão Detalhada */}
      <AlertDialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
        <AlertDialogContent className="max-w-2xl max-h-96 overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl">
              {selectedSuggestion?.titulo}
            </AlertDialogTitle>
            {selectedSuggestion?.confianca && (
              <div className="mt-2">
                <span className="inline-block text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-4 py-1 rounded-full">
                  {selectedSuggestion?.confianca}% de relevância
                </span>
              </div>
            )}
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {selectedSuggestion?.descricao && (
              <div>
                <h3 className="font-bold text-base mb-2">Descrição:</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {selectedSuggestion?.descricao}
                </p>
              </div>
            )}
            {selectedSuggestion?.resumo && (
              <div>
                <h3 className="font-bold text-base mb-2">Resumo:</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSuggestion?.resumo}
                </p>
              </div>
            )}
            {selectedSuggestion?.passos && selectedSuggestion?.passos.length > 0 && (
              <div>
                <h3 className="font-bold text-base mb-2">Passos para Resolver:</h3>
                <ol className="space-y-2">
                  {selectedSuggestion?.passos.map((passo: string, idx: number) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-3">
                      <span className="font-semibold text-primary min-w-6">{idx + 1}.</span>
                      <span>{passo}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {selectedSuggestion?.artigos && selectedSuggestion?.artigos.length > 0 && (
              <div>
                <h3 className="font-bold text-base mb-2">Artigos Relacionados:</h3>
                <div className="space-y-2">
                  {selectedSuggestion?.artigos.map((artigo: any, idx: number) => (
                    <div key={idx} className="p-3 bg-accent/50 rounded-lg border border-border">
                      <p className="font-semibold text-sm">{artigo.titulo}</p>
                      <p className="text-xs text-muted-foreground mt-1">{artigo.descricao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleCloseSuggestionModal} className="w-full">
              Entendido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-slate-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 pt-14 md:pt-16 md:ml-16 lg:ml-20 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/30 to-transparent rounded-full -mr-48 -mt-48 dark:from-blue-900/20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/30 to-transparent rounded-full -ml-48 -mb-48 dark:from-teal-900/20"></div>
      </div>
      
      <div className="relative h-full overflow-auto">
        <div className="min-h-full flex flex-col py-6 md:py-8 px-4 md:px-6 lg:px-8">
          <div className="flex-1 flex flex-col">
            <div className="max-w-7xl mx-auto w-full">
              {/* Cabeçalho */}
              <div className="text-center mb-10">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white mb-3">
                  Criar Novo Chamado
                </h1>
                <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300">
                  Descreva seu problema e receba sugestões automáticas da IA
                </p>
              </div>

              {/* Layout em Grid: Formulário + Sugestões */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 auto-rows-max">
          {/* Coluna 1 e 2: Formulário (2/3 da largura) */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <Card className="border-0 shadow-2xl overflow-hidden">
                <CardContent className="p-8 md:p-10">
                  <div className="space-y-8">
                    {/* Campo Título */}
                    <div className="space-y-3">
                      <Label htmlFor="title" className="text-base font-bold text-foreground">
                        Título do Chamado
                      </Label>
                      <Input
                        id="title"
                        placeholder="Ex: Conexão de internet instável..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="h-12 text-base border-2 focus:border-primary"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Descreva brevemente o problema para ajudar na categorização
                      </p>
                    </div>

                    {/* Campo Descrição */}
                    <div className="space-y-3">
                      <Label htmlFor="description" className="text-base font-bold text-foreground">
                        Descrição Detalhada
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Forneça detalhes do seu problema. Quanto mais informações, melhor podemos ajudar..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-48 text-base resize-none border-2 focus:border-primary"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Mínimo de 20 caracteres para receber sugestões automáticas
                      </p>
                    </div>

                    {/* Categoria e Prioridade */}
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="category" className="text-base font-bold text-foreground">
                          Categoria
                        </Label>
                        <Select
                          value={category}
                          onValueChange={(value) => setCategory(value as TicketCategory)}
                          required
                        >
                          <SelectTrigger id="category" className="h-12 text-base border-2">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TicketCategory.HARDWARE}>Hardware</SelectItem>
                            <SelectItem value={TicketCategory.SOFTWARE}>Software</SelectItem>
                            <SelectItem value={TicketCategory.NETWORK}>Rede</SelectItem>
                            <SelectItem value={TicketCategory.PRINTER}>Impressora</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label htmlFor="priority" className="text-base font-bold text-foreground">
                          Prioridade
                        </Label>
                        <Select
                          value={priority}
                          onValueChange={(value) => setPriority(value as TicketPriority)}
                          required
                        >
                          <SelectTrigger id="priority" className="h-12 text-base border-2">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TicketPriority.LOW}>Baixa</SelectItem>
                            <SelectItem value={TicketPriority.MEDIUM}>Média</SelectItem>
                            <SelectItem value={TicketPriority.HIGH}>Alta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Botão Enviar */}
                    <Button type="submit" className="w-full h-13 text-lg font-bold shadow-lg hover:shadow-xl transition-all" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 size={20} className="mr-2 animate-spin" />
                          Criando Chamado...
                        </>
                      ) : (
                        <>Abrir Chamado</>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </div>

          {/* Coluna 3: Painel de Sugestões da IA (1/3 da largura) */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-2xl h-fit sticky top-32">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
                    <Bot size={24} className="text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Sugestões IA</h3>
                </div>

                <div className="space-y-4">
                  {description.length === 0 ? (
                    <div className="text-center py-10 space-y-4">
                      <div className="relative inline-block mb-3">
                        <Bot size={48} className="text-primary/60" />
                        <Sparkles size={24} className="text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-foreground">
                          Olá! Estou aqui para ajudar
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Comece digitando para receber sugestões inteligentes
                        </p>
                      </div>
                    </div>
                  ) : description.length < 20 ? (
                    <div className="text-center py-10">
                      <div className="relative inline-block mb-3">
                        <Bot size={48} className="text-primary/50" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Mais um pouco para análise...
                      </p>
                    </div>
                  ) : isAnalyzing ? (
                    <div className="text-center py-10">
                      <div className="relative inline-block mb-3">
                        <Bot size={48} className="text-primary animate-pulse" />
                        <Loader2 size={24} className="text-primary absolute -top-2 -right-2 animate-spin" />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Analisando seu problema...
                      </p>
                    </div>
                  ) : aiSuggestions.length === 0 ? (
                    <div className="text-center py-10 space-y-4">
                      <div className="relative inline-block mb-3">
                        <Bot size={48} className="text-primary/60" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-semibold text-foreground">
                          Sem sugestões específicas
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Um técnico especialista irá analisar seu caso
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg border border-green-200 dark:border-green-900/50">
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                          ✅ Encontrei sugestões relevantes!
                        </p>
                      </div>
                      {aiSuggestions.map((suggestion, index) => (
                        <div key={index}>
                          <div 
                            className="border rounded-lg p-4 hover:bg-accent/60 transition-all hover:shadow-md cursor-pointer"
                            onClick={() => handleOpenSuggestionDetail(suggestion)}
                          >
                            <h4 className="font-semibold text-sm mb-2 line-clamp-2">
                              {suggestion.titulo || suggestion.title}
                            </h4>
                            {suggestion.confianca && (
                              <span className="inline-block text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-3 py-1 rounded-full">
                                {Math.round(suggestion.confianca * 100)}% relevante
                              </span>
                            )}
                          </div>
                          {index < aiSuggestions.length - 1 && <Separator className="my-3" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
