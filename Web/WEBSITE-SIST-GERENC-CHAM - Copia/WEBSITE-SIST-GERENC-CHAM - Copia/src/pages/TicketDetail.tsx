import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import { TicketStatus, TicketPriority, Ticket, Comment } from "@/types";
import { apiGet, apiPost, apiPut, apiPatch } from "@/lib/api";
import { 
  ArrowLeft, 
  MessageSquare, 
  Paperclip, 
  Clock, 
  Calendar, 
  User, 
  Tag,
  Send,
  CheckCircle,
  XCircle,
  FileText,
  Loader2
} from "lucide-react";

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isTechnician } = useAuth();
  const { toast } = useToast();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [ticketGuid, setTicketGuid] = useState<string>(""); // GUID real do backend
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isUpdatingTicket, setIsUpdatingTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | "">("");
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | "">("");
  const [kbTitle, setKbTitle] = useState("");
  const [kbContent, setKbContent] = useState("");
  const [isSubmittingKB, setIsSubmittingKB] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      try {
        let ticketData = null;
        const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
        
        // Se for GUID válido, usa endpoint direto; senão, busca nas listas
        if (isGuid) {
          try {
            ticketData = await apiGet(`/api/chamados/${id}`);
          } catch {}
        }

        if (!ticketData) {
          try {
            const myTickets = await apiGet('/api/chamados/meus');
            ticketData = (Array.isArray(myTickets) ? myTickets : []).find((t: any) => {
              const tid = t.idChamado ?? t.id_chamado ?? t.IdChamado ?? t.id;
              return String(tid) === String(id);
            });
          } catch {}
        }
        
        if (ticketData) {
          // Mapear status do banco para enum
          const mapStatus = (status: string): TicketStatus => {
            const statusMap: Record<string, TicketStatus> = {
              'Aberto': TicketStatus.OPEN,
              'aberto': TicketStatus.OPEN,
              'open': TicketStatus.OPEN,
              'Em Análise': TicketStatus.IN_ANALYSIS,
              'em_analise': TicketStatus.IN_ANALYSIS,
              'in_analysis': TicketStatus.IN_ANALYSIS,
              'Aguardando Informação': TicketStatus.WAITING_INFO,
              'aguardando_info': TicketStatus.WAITING_INFO,
              'waiting_info': TicketStatus.WAITING_INFO,
              'Em Andamento': TicketStatus.IN_PROGRESS,
              'em_andamento': TicketStatus.IN_PROGRESS,
              'in_progress': TicketStatus.IN_PROGRESS,
              'Resolvido': TicketStatus.RESOLVED,
              'resolvido': TicketStatus.RESOLVED,
              'resolved': TicketStatus.RESOLVED,
              'Fechado': TicketStatus.CLOSED,
              'fechado': TicketStatus.CLOSED,
              'closed': TicketStatus.CLOSED,
            };
            return statusMap[status] || TicketStatus.OPEN;
          };
          
          // Mapear prioridade do banco para enum
          const mapPriority = (priority: string): TicketPriority => {
            const priorityMap: Record<string, TicketPriority> = {
              'Baixa': TicketPriority.LOW,
              'baixa': TicketPriority.LOW,
              'low': TicketPriority.LOW,
              'Média': TicketPriority.MEDIUM,
              'media': TicketPriority.MEDIUM,
              'medium': TicketPriority.MEDIUM,
              'Alta': TicketPriority.HIGH,
              'alta': TicketPriority.HIGH,
              'high': TicketPriority.HIGH,
            };
            return priorityMap[priority] || TicketPriority.MEDIUM;
          };
          
          // Mapear campos do banco
          const mappedTicket: Ticket = {
            id: String(ticketData.idChamado ?? ticketData.id_chamado ?? ticketData.IdChamado ?? ticketData.id ?? id),
            title: ticketData.titulo || ticketData.title || 'Sem título',
            description: ticketData.descricao || ticketData.description || '',
            status: mapStatus(ticketData.status || 'Aberto'),
            priority: mapPriority(ticketData.prioridade || ticketData.urgencia || 'Média'),
            category: (ticketData.idCategoria ?? ticketData.categoria ?? ticketData.category ?? 'hardware').toString(),
            createdAt: new Date(ticketData.dataAbertura ?? ticketData.dataabertura ?? ticketData.dataCriacao ?? ticketData.createdAt ?? Date.now()),
            updatedAt: new Date(ticketData.dataAtualizacao ?? ticketData.dataatualizacao ?? ticketData.updatedAt ?? Date.now()),
            requesterId: ticketData.idCliente ?? ticketData.id_cliente ?? ticketData.usuarioId ?? '',
            requesterName: ticketData.nomeUsuario || ticketData.requesterName || 'Usuário',
            assigneeId: ticketData.idTecnicoAtribuido ?? ticketData.id_tecnico_atribuido ?? ticketData.id_tecnico ?? ticketData.tecnicoId,
            assigneeName: ticketData.nomeTecnico || ticketData.assigneeName || '',
            iaSuggestion: ticketData.resolucaoIA_Sugerida ?? ticketData.ResolucaoIA_Sugerida ?? '',
            aiSuggestionSent: ticketData.sugestaoIAEnviada ?? ticketData.SugestaoIAEnviada ?? '',
          };
          
          // Armazenar o GUID real - priorizar 'id' que vem do backend com primeira letra minúscula
          const realGuid = ticketData.id ?? ticketData.Id ?? ticketData.ID;
          console.log('GUID detectado:', realGuid, 'de ticketData:', ticketData);
          if (realGuid && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(realGuid))) {
            setTicketGuid(String(realGuid));
          } else {
            // Se não encontrar GUID, usar o ID da URL se for GUID
            if (id && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id)) {
              setTicketGuid(id);
            }
          }
          
          setTicket(mappedTicket);
          setSelectedStatus(mappedTicket.status);
          setSelectedPriority(mappedTicket.priority);
          
          setKbTitle(mappedTicket.title);
          setKbContent(
`# ${mappedTicket.title}

## Problema
${mappedTicket.description}

## Solução
[Adicione a solução aqui]

## Passos para resolver
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Informações adicionais
- [Informação relevante]
- [Links úteis]
`
          );
        } else {
          toast({
            title: "Chamado não encontrado",
            description: "O chamado solicitado não existe.",
            variant: "destructive",
          });
          navigate(-1);
        }
        
        // Buscar comentários do chamado
        try {
          const commentsData = await apiGet(`/api/chamados/${id}/comentarios`);
          
          // Mapear comentários do backend para o formato do frontend
          const mappedComments = (Array.isArray(commentsData) ? commentsData : []).map((c: any) => {
            // Determinar papel do autor: 1=Colaborador, 2=Técnico, 3=Administrador
            const perfilId = c.id_perfil ?? c.idPerfil ?? c.nivelAcesso ?? c.authorRole ?? 1;
            let role: 'collaborator' | 'technician' | 'administrator' = 'collaborator';
            if (perfilId === 2) role = 'technician';
            else if (perfilId === 3) role = 'administrator';
            
            return {
              id: String(c.idInteracao ?? c.id_interacao ?? c.id ?? Date.now()),
              content: c.comentario ?? c.conteudo ?? '',
              authorId: c.idUsuario ?? c.id_usuario ?? c.usuarioId ?? c.id_autor,
              authorName: c.nomeAutor ?? c.nome_autor ?? 'Usuário',
              authorRole: role,
              ticketId: String(id),
              isPublic: true,
              createdAt: new Date(c.dataHora ?? c.datahora ?? Date.now()),
            };
          });
          
          setComments(mappedComments);
        } catch (error) {
          // Se falhar, manter lista vazia
          setComments([]);
        }
      } catch (error) {
        console.error("Error fetching ticket data:", error);
        toast({
          title: "Erro ao carregar chamado",
          description: "Não foi possível carregar os dados do chamado.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [id, toast, navigate]);

  // Buscar lista de técnicos se o usuário for técnico ou admin
  useEffect(() => {
    if (user && (user.role === 'technician' || user.role === 'administrator')) {
      const fetchTechnicians = async () => {
        try {
          const users = await apiGet('/api/usuarios');
          const techList = (Array.isArray(users) ? users : [])
            .filter((u: any) => {
              const role = u.id_perfil ?? u.idPerfil ?? u.nivelAcesso ?? u.role;
              return role === 2; // 2 = Técnico
            })
            .map((u: any) => ({
              id: u.id,
              name: u.nome_completo ?? u.nomeCompleto ?? u.nome ?? u.name,
            }));
          setTechnicians(techList);
        } catch (error: any) {
          if (error.status === 403) {
            console.warn('Acesso negado para listar técnicos - permissão insuficiente');
          } else {
            console.error('Erro ao buscar técnicos:', error);
          }
          // Continua sem a lista de técnicos
          setTechnicians([]);
        }
      };
      fetchTechnicians();
    }
  }, [user]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newComment.trim() || !user || !ticket) return;
    
    setIsSubmittingComment(true);
    try {
      console.log('=== ADICIONANDO COMENTÁRIO ===');
      console.log('Ticket ID:', ticket.id);
      console.log('Dados:', { conteudo: newComment, id_autor: user.id, publico: isPublic });
      
      const commentData = await apiPost(`/api/chamados/${ticket.id}/comentarios`, {
        comentario: newComment,
      });
      
      console.log('Comentário criado:', commentData);
      
      // Adicionar o comentário à lista local
      const newCommentObj: Comment = {
        id: String(commentData?.idInteracao ?? commentData?.id_interacao ?? Date.now()),
        content: newComment,
        authorId: user.id,
        authorName: user.name,
        authorRole: user.role,
        ticketId: ticket.id,
        isPublic: true,
        createdAt: new Date(),
      };
      
      setComments([...comments, newCommentObj]);
      setNewComment("");
      toast({
        title: "Comentário adicionado",
        description: "Seu comentário foi adicionado com sucesso.",
      });
    } catch (error: any) {
      console.error("=== ERRO AO ADICIONAR COMENTÁRIO ===");
      console.error("Erro completo:", error);
      console.error("Status:", error.status);
      console.error("Body:", error.body);
      
      // Se for 404, é porque o endpoint não existe ainda
      if (error.status === 404) {
        toast({
          title: "Funcionalidade em desenvolvimento",
          description: "O sistema de comentários ainda está sendo implementado no backend.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao adicionar comentário",
          description: error.body?.detail || error.message || "Não foi possível adicionar o comentário.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleUpdateTicket = async () => {
    if (!ticket || !selectedStatus || !selectedPriority) return;
    
    setIsUpdatingTicket(true);
    try {
      // Mapear status de volta para o formato do banco (português)
      const statusToAPI = (status: TicketStatus): string => {
        const statusMap: Record<TicketStatus, string> = {
          [TicketStatus.OPEN]: 'Aberto',
          [TicketStatus.IN_ANALYSIS]: 'Em Análise',
          [TicketStatus.WAITING_INFO]: 'Aguardando Informação',
          [TicketStatus.IN_PROGRESS]: 'Em Andamento',
          [TicketStatus.RESOLVED]: 'Resolvido',
          [TicketStatus.CLOSED]: 'Fechado',
        };
        return statusMap[status] || 'Aberto';
      };
      
      // Mapear prioridade de volta para o formato do banco (português)
      const priorityToAPI = (priority: TicketPriority): string => {
        const priorityMap: Record<TicketPriority, string> = {
          [TicketPriority.LOW]: 'Baixa',
          [TicketPriority.MEDIUM]: 'Média',
          [TicketPriority.HIGH]: 'Alta',
        };
        return priorityMap[priority] || 'Média';
      };
      
      // Enviar atualização para o banco de dados
      const updateData = {
        status: statusToAPI(selectedStatus),
        prioridade: priorityToAPI(selectedPriority),
      };
      
      console.log('=== ATUALIZANDO CHAMADO ===');
      console.log('ID:', ticket.id);
      console.log('Dados enviados:', updateData);
      
      // Tentar PATCH primeiro (mais comum para atualizações parciais)
      try {
        const response = await apiPatch(`/api/chamados/${ticket.id}`, updateData);
        console.log('Sucesso com PATCH:', response);
      } catch (patchError: any) {
        // Se PATCH falhar, tentar PUT
        console.log('PATCH falhou, tentando PUT');
        const response = await apiPut(`/api/chamados/${ticket.id}`, updateData);
        console.log('Sucesso com PUT:', response);
      }
      
      // Atualizar o estado local com os novos valores
      setTicket({
        ...ticket,
        status: selectedStatus,
        priority: selectedPriority,
        updatedAt: new Date(),
      });
      
      toast({
        title: "Chamado atualizado",
        description: "As informações do chamado foram atualizadas com sucesso.",
      });
    } catch (error: any) {
      console.error("=== ERRO AO ATUALIZAR CHAMADO ===");
      console.error("Erro completo:", error);
      console.error("Status:", error.status);
      console.error("Body:", error.body);
      
      toast({
        title: "Erro ao atualizar chamado",
        description: error.body?.detail || error.message || "Não foi possível atualizar o chamado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingTicket(false);
    }
  };

  const handleCreateKBArticle = async () => {
    if (!ticket || !user || !kbTitle.trim() || !kbContent.trim()) return;
    
    setIsSubmittingKB(true);
    try {
      await apiPost('/api/artigos', {
        titulo: kbTitle,
        conteudo: kbContent,
        id_autor: user.id,
        categoria: ticket.category,
        tags: [ticket.category, ...kbTitle.toLowerCase().split(' ')],
      });
      
      toast({
        title: "Artigo criado com sucesso",
        description: "O artigo foi adicionado à base de conhecimento.",
      });
    } catch (error) {
      console.error("Error creating KB article:", error);
      toast({
        title: "Erro ao criar artigo",
        description: "Não foi possível criar o artigo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingKB(false);
    }
  };

  const handleAssignTechnician = async (technicianId: string) => {
    if (!ticket) return;
    
    // Usar GUID real se disponível, caso contrário usar o ID do ticket
    const idToUse = ticketGuid || ticket.id;
    
    setIsAssigning(true);
    try {
      await apiPost(`/api/chamados/${idToUse}/atribuir`, {
        tecnicoId: technicianId,
      });
      
      // Atualizar ticket localmente
      const assignedTech = technicians.find(t => t.id === technicianId);
      setTicket({
        ...ticket,
        assigneeId: technicianId,
        assigneeName: assignedTech?.name || 'Técnico',
      });
      
      toast({
        title: "Chamado atribuído",
        description: technicianId === user?.id 
          ? "Você assumiu este chamado."
          : `Chamado atribuído a ${assignedTech?.name || 'outro técnico'}.`,
      });
      
      setSelectedTechnician("");
    } catch (error) {
      console.error('Erro ao atribuir técnico:', error);
      toast({
        title: "Erro ao atribuir",
        description: "Não foi possível atribuir o técnico ao chamado.",
        variant: "destructive",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <h3 className="text-xl font-semibold mb-2">Chamado não encontrado</h3>
        <p className="text-muted-foreground mb-4">O chamado solicitado não existe ou foi removido.</p>
        <Button onClick={() => navigate(-1)}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 overflow-hidden pt-14 md:pt-16 md:ml-16 lg:ml-20">
      {/* Decorative elements */}
      <div className="absolute top-14 md:top-16 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/20 to-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative w-full h-full flex flex-col p-4 md:p-8 overflow-hidden">
        {!ticket ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
              <p className="text-gray-600">Carregando detalhes do chamado...</p>
            </div>
          </div>
        ) : (
          <div className="max-w-7xl w-full mx-auto flex flex-col h-full flex-1 overflow-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 flex-shrink-0">
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="border-2 border-gray-300 hover:bg-gray-100"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft size={20} />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-gray-900">#{ticket.id}</h1>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <h2 className="text-xl text-gray-600 mt-2">{ticket.title}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(user?.id === ticket.assigneeId || !ticket.assigneeId) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className={`h-11 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all ${
                        ticket.status === "resolved" 
                          ? "bg-gray-400 hover:bg-gray-500 text-white" 
                          : "bg-teal-600 hover:bg-teal-700 text-white"
                      }`}>
                        {ticket.status === "resolved" ? "Reabrir Chamado" : "Marcar como Resolvido"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {ticket.status === "resolved" 
                            ? "Reabrir Chamado?" 
                            : "Marcar como Resolvido?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {ticket.status === "resolved" 
                            ? "Isso reabrirá o chamado e permitirá novas interações."
                            : "Isso marcará o chamado como resolvido. O solicitante poderá reabri-lo se necessário."}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async () => {
                            try {
                              const newStatus = ticket.status === TicketStatus.RESOLVED 
                                ? 'Aberto'
                                : 'Resolvido';
                              
                              await apiPut(`/api/chamados/${ticket.id}`, {
                                status: newStatus,
                              });
                              
                              toast({
                                title: "Chamado atualizado",
                                description: `Chamado marcado como ${newStatus.toLowerCase()}.`,
                              });
                              
                              window.location.reload();
                            } catch (error) {
                              console.error("Error updating ticket:", error);
                              toast({
                                title: "Erro",
                                description: "Não foi possível atualizar o chamado.",
                                variant: "destructive",
                              });
                            }
                          }}
                        >
                          Confirmar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Content Grid */}
            <div className="flex-1 overflow-auto grid grid-cols-1 lg:grid-cols-3 gap-6 pr-4">
              {/* Main Content */}
              <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
                {/* Description Card */}
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm flex-shrink-0">
                  <CardContent className="p-6">
                    <div className="prose max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Descrição</h3>
                      <p className="text-gray-700">{ticket.description}</p>
                    </div>
                    {user && (user.role === 'administrator' || user.role === 'technician') && ticket.aiSuggestionSent && (
                      <div className="mt-4 p-4 rounded border bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                        <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-200">🤖 Sugestões enviadas ao colaborador</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300 whitespace-pre-wrap">{ticket.aiSuggestionSent}</p>
                      </div>
                    )}
                    {user && (user.role === 'administrator' || user.role === 'technician') && ticket.iaSuggestion && (
                      <div className="mt-4 p-4 rounded border bg-muted">
                        <h4 className="text-sm font-semibold mb-2">Sugestão da IA (visível apenas para Técnico/Admin)</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.iaSuggestion}</p>
                      </div>
                    )}
                    
                    <Separator className="my-6" />
                    
                    <Tabs defaultValue="comments">
                      <TabsList className="mb-4">
                        <TabsTrigger value="comments">
                          <MessageSquare size={16} className="mr-2" />
                          Comentários ({comments.filter(c => c.isPublic || user?.id === ticket.assigneeId).length})
                        </TabsTrigger>
                        {!isTechnician && (
                          <TabsTrigger value="kb" disabled={!ticket.assigneeId || user?.id !== ticket.assigneeId}>
                            <FileText size={16} className="mr-2" />
                            Base de Conhecimento
                          </TabsTrigger>
                        )}
                      </TabsList>
                      
                      <TabsContent value="comments" className="space-y-6">
                        {comments
                          .filter(comment => comment.isPublic || user?.id === ticket.assigneeId)
                          .map((comment) => (
                            <div key={comment.id} className={`rounded-lg p-4 ${
                              comment.isPublic 
                                ? 'bg-muted'
                                : 'bg-yellow-50 border border-yellow-100'}`}>
                              <div className="flex">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src="" />
                                  <AvatarFallback className="bg-primary text-primary-foreground">
                                    {getUserInitials(comment.authorName)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="ml-4 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-medium">{comment.authorName}</h4>
                                      <Badge variant={comment.authorRole === 'technician' || comment.authorRole === 'administrator' ? 'default' : 'secondary'} className="text-xs">
                                        {comment.authorRole === 'technician' || comment.authorRole === 'administrator' ? 'Técnico' : 'Colaborador'}
                                      </Badge>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                      {comment.createdAt.toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                  <p className="mt-1">{comment.content}</p>
                                  
                                  {!comment.isPublic && (
                                    <p className="mt-2 text-xs text-yellow-600 flex items-center">
                                      <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded text-xs">
                                        Nota Interna
                                      </span>
                                      <span className="ml-2">Visível apenas para a equipe de suporte</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          
                        {comments.filter(c => c.isPublic || user?.id === ticket.assigneeId).length === 0 && (
                          <div className="text-center py-8">
                            <p className="text-muted-foreground">
                              Nenhum comentário neste chamado ainda.
                            </p>
                          </div>
                        )}

                        <form onSubmit={handleAddComment} className="mt-6">
                          <div className="space-y-4">
                            <Textarea
                              placeholder="Adicione um comentário ou atualização..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows={3}
                              disabled={isSubmittingComment}
                            />
                            
                            {user?.id === ticket.assigneeId && (
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  className={`flex items-center mr-4 ${!isPublic ? 'text-primary' : 'text-muted-foreground'}`}
                                  onClick={() => setIsPublic(false)}
                                >
                                  <CheckCircle size={16} className={`mr-1 ${!isPublic ? 'text-primary' : 'text-muted-foreground'}`} />
                                  Nota Interna
                                </button>
                                <button
                                  type="button"
                                  className={`flex items-center ${isPublic ? 'text-primary' : 'text-muted-foreground'}`}
                                  onClick={() => setIsPublic(true)}
                                >
                                  <CheckCircle size={16} className={`mr-1 ${isPublic ? 'text-primary' : 'text-muted-foreground'}`} />
                                  Comentário Público
                                </button>
                              </div>
                            )}
                            
                            <div className="flex justify-end">
                              <Button 
                                type="submit"
                                disabled={!newComment.trim() || isSubmittingComment}
                              >
                                {isSubmittingComment ? (
                                  <>
                                    <Loader2 size={16} className="mr-2 animate-spin" />
                                    Enviando...
                                  </>
                                ) : (
                                  <>
                                    <Send size={16} className="mr-2" />
                                    Enviar
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </form>
                      </TabsContent>
                      
                      <TabsContent value="kb">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Criar Artigo para Base de Conhecimento</h3>
                          <p className="text-sm text-muted-foreground">
                            Crie um artigo na base de conhecimento com a solução deste chamado.
                          </p>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium" htmlFor="kb-title">
                                Título do Artigo
                              </label>
                              <input
                                id="kb-title"
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                                value={kbTitle}
                                onChange={(e) => setKbTitle(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label className="text-sm font-medium" htmlFor="kb-content">
                                Conteúdo (Markdown)
                              </label>
                              <Textarea
                                id="kb-content"
                                rows={15}
                                value={kbContent}
                                onChange={(e) => setKbContent(e.target.value)}
                                className="font-mono text-sm"
                              />
                            </div>
                            
                            <Button 
                              onClick={handleCreateKBArticle}
                              disabled={!kbTitle.trim() || !kbContent.trim() || isSubmittingKB}
                            >
                              {isSubmittingKB ? (
                                <>
                                  <Loader2 size={16} className="mr-2 animate-spin" />
                                  Criando Artigo...
                                </>
                              ) : (
                                <>
                                  <FileText size={16} className="mr-2" />
                                  Criar Artigo
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
              
              {/* Sidebar */}
              <div>
                <Card className="border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium">Status</h3>
                        <Select
                          value={selectedStatus}
                          onValueChange={(value) => setSelectedStatus(value as TicketStatus)}
                          disabled={user?.role === "collaborator" || !isTechnician}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TicketStatus.OPEN}>Aberto</SelectItem>
                            <SelectItem value={TicketStatus.IN_PROGRESS}>Em Andamento</SelectItem>
                            <SelectItem value={TicketStatus.RESOLVED}>Resolvido</SelectItem>
                            <SelectItem value={TicketStatus.CLOSED}>Fechado</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <h3 className="text-sm font-medium">Prioridade</h3>
                        <Select
                          value={selectedPriority}
                          onValueChange={(value) => setSelectedPriority(value as TicketPriority)}
                          disabled={user?.role === "collaborator" || !isTechnician}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={TicketPriority.LOW}>Baixa</SelectItem>
                            <SelectItem value={TicketPriority.MEDIUM}>Média</SelectItem>
                            <SelectItem value={TicketPriority.HIGH}>Alta</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {(user?.id === ticket.assigneeId || user?.id === ticket.requesterId) && 
                        (selectedStatus !== ticket.status || selectedPriority !== ticket.priority) && (
                          <Button 
                            onClick={handleUpdateTicket}
                            className="w-full"
                            disabled={isUpdatingTicket}
                          >
                            {isUpdatingTicket ? (
                              <>
                                <Loader2 size={16} className="mr-2 animate-spin" />
                                Atualizando...
                              </>
                            ) : (
                              "Salvar Alterações"
                            )}
                          </Button>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-sm font-medium mb-2">Atendente</h3>
                        {ticket.assigneeId ? (
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {getUserInitials(ticket.assigneeName || "")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-2">
                              <p className="text-sm font-medium">{ticket.assigneeName}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Não atribuído</p>
                            {(user?.role === 'technician' || user?.role === 'administrator') && (
                              <Button
                                size="sm"
                                onClick={() => handleAssignTechnician(user.id)}
                                disabled={isAssigning}
                                className="w-full"
                              >
                                {isAssigning ? (
                                  <>
                                    <Loader2 size={14} className="mr-2 animate-spin" />
                                    Atribuindo...
                                  </>
                                ) : (
                                  "Pegar para mim"
                                )}
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium">Detalhes</h3>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center">
                            <User size={14} className="mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Solicitante:</span>
                          </div>
                          <div>{ticket.requesterName}</div>
                          
                          <div className="flex items-center">
                            <Calendar size={14} className="mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Criado em:</span>
                          </div>
                          <div>{new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</div>
                          
                          <div className="flex items-center">
                            <Clock size={14} className="mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Atualizado:</span>
                          </div>
                          <div>{new Date(ticket.updatedAt).toLocaleDateString('pt-BR')}</div>
                          
                          {ticket.closedAt && (
                            <>
                              <div className="flex items-center">
                                <CheckCircle size={14} className="mr-2 text-muted-foreground" />
                                <span className="text-muted-foreground">Fechado em:</span>
                              </div>
                              <div>{new Date(ticket.closedAt).toLocaleDateString('pt-BR')}</div>
                            </>
                          )}
                          
                          <div className="flex items-center">
                            <Tag size={14} className="mr-2 text-muted-foreground" />
                            <span className="text-muted-foreground">Categoria:</span>
                          </div>
                          <div className="capitalize">{ticket.category}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
