import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Ticket, TicketStatus, TicketPriority, TicketCategory, UserRole, Comment } from "@/types";
import { apiGet, apiPut, apiPost } from "@/lib/api";
import {
  ArrowLeft,
  Send,
  Check,
  Edit2,
  Clock,
  MessageSquare,
  FileText,
  User,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";

const STATUS_OPTIONS = [
  { value: "Aberto", label: "Aberto" },
  { value: "Em Andamento", label: "Em Andamento" },
  { value: "Resolvido", label: "Resolvido" },
  { value: "Fechado", label: "Fechado" },
];

// Convert backend status enum (0, 1, 2, 3) to Portuguese labels
const convertBackendStatus = (status: any): string => {
  if (typeof status === 'number') {
    const statusMap: Record<number, string> = {
      0: 'Aberto',
      1: 'Em Andamento',
      2: 'Resolvido',
      3: 'Fechado'
    };
    return statusMap[status] || 'Aberto';
  }
  if (typeof status === 'string') {
    if (status === 'EmAtendimento') return 'Em Andamento';
    return status;
  }
  return 'Aberto';
};

const CATEGORY_OPTIONS = [
  { value: "Hardware", label: "Hardware" },
  { value: "Software", label: "Software" },
  { value: "Rede", label: "Rede" },
  { value: "Impressora", label: "Impressora" },
];

const PRIORITY_OPTIONS = [
  { value: "Baixa", label: "Baixa" },
  { value: "Média", label: "Média" },
  { value: "Alta", label: "Alta" },
];

const toDate = (v: any): Date => (v instanceof Date ? v : new Date(v));

export default function TicketDetailPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  
  // Form states
  const [newStatus, setNewStatus] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState("");

  // Load ticket details
  useEffect(() => {
    const load = async () => {
      try {
        // Try to get all tickets and find the one with matching ID
        let ticketData;
        
        try {
          const allTickets = await apiGet('/api/chamados/todos');
          if (Array.isArray(allTickets)) {
            ticketData = allTickets.find((t: any) => {
              const ticketId = String(t.idChamado ?? t.id_chamado ?? t.id ?? t.IdChamado ?? t.Id_chamado);
              return ticketId === id;
            });
          }
        } catch (err: any) {
          console.warn('Erro ao carregar todos os chamados:', err);
          ticketData = null;
        }
        
        // Fallback: try direct endpoint (in case it's fixed)
        if (!ticketData) {
          try {
            ticketData = await apiGet(`/api/chamados/${id}`);
          } catch (err: any) {
            console.warn('Erro ao carregar chamado direto:', err);
          }
        }
        
        if (ticketData) {
          // Load comments separately
          let comments = [];
          try {
            const commentsResponse = await apiGet(`/api/chamados/${id}/comentarios`);
            if (Array.isArray(commentsResponse)) {
              comments = commentsResponse
                .map((c: any) => {
                  const mapped = {
                    id: c.idInteracao?.toString() || c.id || c.idComentario || `comment-${Math.random()}`,
                    content: c.comentario || c.conteudo || c.content || c.texto || '',
                    createdAt: new Date(c.dataHora || c.createdAt || c.dataCriacao || Date.now()),
                    authorId: c.idUsuario || c.usuarioId || c.authorId || c.id_autor || '',
                    authorName: c.nomeAutor || c.authorName || c.nome_autor || 'Técnico',
                    authorRole: (c.autorPapel === 'Tecnico' || c.authorRole === 'technician') ? 'technician' : 'collaborator',
                    ticketId: id,
                    isPublic: c.publico ?? c.isPublic ?? c.Publico ?? false,
                  };
                  return mapped;
                })
                .filter((c: any) => c.content && c.content.trim()); // Filtrar comentários vazios
              console.log('Comentários após filtro:', comments);
            }
          } catch (err: any) {
            console.warn('Erro ao carregar comentários do endpoint:', err);
            // Se não conseguir carregar pelo endpoint, tenta usar os comentários que vêm no ticket
            if (ticketData.comentarios && Array.isArray(ticketData.comentarios)) {
              comments = ticketData.comentarios
                .map((c: any) => ({
                  id: c.idInteracao?.toString() || c.id || c.idComentario || `comment-${Math.random()}`,
                  content: c.comentario || c.conteudo || c.content || c.texto || '',
                  createdAt: new Date(c.dataHora || c.dataCriacao || c.createdAt || Date.now()),
                  authorId: c.idUsuario || c.autorId || c.authorId || c.usuarioId || '',
                  authorName: c.autorNome || c.authorName || c.nomeAutor || 'Técnico',
                  authorRole: c.autorPapel === 'Tecnico' || c.authorRole === 'technician' ? 'technician' : 'collaborator',
                  ticketId: id,
                  isPublic: c.isPublico ?? c.isPublic ?? false,
                }))
                .filter((c: any) => c.content && c.content.trim()); // Filtrar comentários vazios
            }
          }

          const mapped = {
            id: String(ticketData.idChamado ?? ticketData.id_chamado ?? ticketData.id ?? ticketData.IdChamado),
            title: ticketData.titulo || ticketData.title || 'Sem título',
            description: ticketData.descricao || ticketData.description || '',
            status: convertBackendStatus(ticketData.status),
            priority: ticketData.prioridade ?? ticketData.urgencia ?? ticketData.priority ?? 'Média',
            category: String(ticketData.categoria ?? ticketData.category ?? 'hardware').toLowerCase(),
            createdAt: ticketData.dataAbertura ?? ticketData.dataabertura ?? ticketData.createdAt ?? new Date(),
            updatedAt: ticketData.dataAtualizacao ?? ticketData.dataatualizacao ?? ticketData.updatedAt ?? new Date(),
            requesterId: ticketData.id_cliente ?? ticketData.idCliente ?? ticketData.usuarioId ?? '',
            requesterName: ticketData.nome_cliente ?? ticketData.nomeCliente ?? ticketData.nomeUsuario ?? 'Usuário',
            assigneeId: ticketData.id_tecnico ?? ticketData.idTecnico ?? ticketData.tecnicoId ?? '',
            assigneeName: ticketData.nome_tecnico ?? ticketData.nomeTecnico ?? ticketData.assigneeName ?? 'Não atribuído',
            comments: comments,
          } as Ticket;
          
          console.log('Ticket carregado com', comments.length, 'comentários');
          
          setTicket(mapped);
          setEditDescription(mapped.description);
          setEditCategory(mapped.category);
          setEditPriority(mapped.priority);
        }
      } catch (err) {
        console.error('Erro ao carregar chamado:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (id) load();
  }, [id]);

  // Change status
  const handleChangeStatus = async () => {
    if (!ticket || !newStatus) return;

    setIsSubmitting(true);
    try {
      // Send complete chamado object with all required fields
      const updatedChamado = {
        id: ticket.id,
        titulo: ticket.title,
        descricao: ticket.description,
        status: newStatus,
        prioridade: ticket.priority,
        categoria: ticket.category,
        dataAbertura: ticket.createdAt,
        usuarioId: ticket.requesterId,
        tecnicoId: ticket.assigneeId || null,
      };

      await apiPut(`/api/chamados/${ticket.id}`, updatedChamado);
      setTicket(prev => prev ? { ...prev, status: newStatus as TicketStatus } : null);
      setShowStatusModal(false);
      setNewStatus("");
      alert('Status alterado com sucesso!');
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!ticket || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      console.log('Adicionando comentário ao ticket:', ticket.id);
      
      await apiPost(`/api/chamados/${ticket.id}/comentarios`, {
        Conteudo: commentText,
        Id_Autor: user?.id,
        Publico: false,
      });

      console.log('Comentário adicionado com sucesso');

      // Recarregar comentários do banco após adicionar
      try {
        const commentsResponse = await apiGet(`/api/chamados/${ticket.id}/comentarios`);
        if (Array.isArray(commentsResponse)) {
          const updatedComments = commentsResponse
            .map((c: any) => ({
              id: c.idInteracao?.toString() || c.id || c.idComentario || `comment-${Math.random()}`,
              content: c.comentario || c.conteudo || c.content || c.texto || '',
              createdAt: new Date(c.dataHora || c.createdAt || c.dataCriacao || Date.now()),
              authorId: c.idUsuario || c.usuarioId || c.authorId || c.id_autor || '',
              authorName: c.nomeAutor || c.authorName || c.nome_autor || 'Técnico',
              authorRole: (c.autorPapel === 'Tecnico' || c.authorRole === 'technician') ? 'technician' : 'collaborator',
              ticketId: ticket.id,
              isPublic: c.publico ?? c.isPublic ?? c.Publico ?? false,
            }))
            .filter((c: any) => c.content && c.content.trim()); // Filtrar comentários vazios

          setTicket(prev => prev ? {
            ...prev,
            comments: updatedComments as Comment[],
          } : null);
          
          console.log('Comentários recarregados do banco:', updatedComments.length);
        }
      } catch (err) {
        console.warn('Erro ao recarregar comentários:', err);
        // Se recarregar falhar, mantém o comentário localmente
        const newComment = {
          id: `temp-${Date.now()}`,
          content: commentText,
          createdAt: new Date(),
          authorId: user?.id || '',
          authorName: user?.name || '',
          authorRole: user?.role || UserRole.TECHNICIAN,
          ticketId: ticket.id,
          isPublic: false,
        };

        setTicket(prev => prev ? {
          ...prev,
          comments: [...(prev.comments || []), newComment as Comment],
        } : null);
      }
      
      setCommentText("");
      setShowCommentModal(false);
      alert('Comentário adicionado com sucesso!');
    } catch (err: any) {
      console.error('Erro completo ao adicionar comentário:', err);
      console.error('Status:', err?.status);
      console.error('Message:', err?.message);
      alert(`Erro ao adicionar comentário: ${err?.message || 'Erro desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update ticket info
  const handleUpdateInfo = async () => {
    if (!ticket) return;

    setIsSubmitting(true);
    try {
      // Send complete chamado object with all required fields
      const updatedChamado = {
        id: ticket.id,
        titulo: ticket.title,
        descricao: editDescription || ticket.description,
        status: ticket.status,
        prioridade: editPriority || ticket.priority,
        categoria: editCategory || ticket.category,
        dataAbertura: ticket.createdAt,
        usuarioId: ticket.requesterId,
        tecnicoId: ticket.assigneeId || null,
      };

      await apiPut(`/api/chamados/${ticket.id}`, updatedChamado);

      setTicket(prev => prev ? {
        ...prev,
        description: editDescription || prev.description,
        category: (editCategory || prev.category) as TicketCategory,
        priority: (editPriority || prev.priority) as TicketPriority,
      } : null);

      setShowEditModal(false);
      alert('Informações atualizadas com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      alert('Erro ao atualizar chamado');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-14 md:pt-16 md:ml-16 lg:ml-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes do chamado...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-14 md:pt-16 md:ml-16 lg:ml-20 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Chamado não encontrado</p>
          <Button onClick={() => navigate('/technician/ticket-management')} className="bg-teal-500 hover:bg-teal-600">
            Voltar para Gerenciamento
          </Button>
        </div>
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
        <div className="max-w-4xl w-full mx-auto flex flex-col h-full overflow-hidden gap-6">
          {/* Header */}
          <div className="flex-shrink-0 flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/technician/ticket-management')}
              className="border-teal-400 text-teal-600 hover:bg-teal-50"
            >
              <ArrowLeft size={18} />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">
                #{ticket.id} - {ticket.title}
              </h1>
              <p className="text-gray-600">Detalhes e gerenciamento do chamado</p>
            </div>
          </div>

          {/* Main Content - Two Columns */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
            {/* Left Column - Ticket Info */}
            <div className="lg:col-span-2 space-y-4 overflow-auto">
              {/* Info Card */}
              <Card className="border-2 border-gray-200 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Informações do Chamado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">CLIENTE</p>
                      <p className="font-semibold text-gray-900">{ticket.requesterName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">ATRIBUÍDO A</p>
                      <p className="font-semibold text-gray-900">{ticket.assigneeName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">STATUS</p>
                      <TicketStatusBadge status={ticket.status} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">PRIORIDADE</p>
                      <TicketPriorityBadge priority={ticket.priority as any} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">CATEGORIA</p>
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full capitalize">
                        {ticket.category}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">CRIADO EM</p>
                      <p className="text-sm text-gray-600">{toDate(ticket.createdAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-gray-500 font-semibold mb-2">DESCRIÇÃO</p>
                    <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 max-h-32 overflow-auto border border-gray-200">
                      {ticket.description}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section */}
              <Card className="border-2 border-gray-200 bg-white/95 backdrop-blur-sm flex-1 flex flex-col overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare size={20} />
                      Comentários Técnicos
                    </CardTitle>
                    <span className="text-xs bg-teal-100 text-teal-700 px-3 py-1 rounded-full font-semibold">
                      {ticket.comments?.length || 0}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 overflow-auto flex-1">
                  {ticket.comments && ticket.comments.length > 0 ? (
                    ticket.comments.map(comment => (
                      <div key={comment.id} className="bg-blue-50 p-4 rounded-lg border-l-4 border-teal-400">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-teal-700">{comment.authorName}</p>
                          <p className="text-xs text-gray-500">{toDate(comment.createdAt).toLocaleString('pt-BR')}</p>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-8">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Actions */}
            <div className="flex flex-col gap-4 overflow-auto">
              <Card className="border-2 border-gray-200 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Status Change Button */}
                  <Button
                    onClick={() => setShowStatusModal(true)}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    <Check size={16} className="mr-2" />
                    Alterar Status
                  </Button>

                  {/* Edit Info Button */}
                  <Button
                    onClick={() => setShowEditModal(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600"
                  >
                    <Edit2 size={16} className="mr-2" />
                    Editar Informações
                  </Button>

                  {/* Add Comment Button */}
                  <Button
                    onClick={() => {
                      console.log('Clicado em Adicionar Comentário');
                      setShowCommentModal(true);
                    }}
                    className="w-full bg-green-500 hover:bg-green-600"
                  >
                    <MessageSquare size={16} className="mr-2" />
                    Adicionar Comentário
                  </Button>
                </CardContent>
              </Card>

              {/* Info Box */}
              <Card className="border-2 border-gray-200 bg-white/95 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Status do Chamado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Status Atual:</p>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Prioridade:</p>
                    <TicketPriorityBadge priority={ticket.priority as any} />
                  </div>
                  <div>
                    <p className="text-gray-500 font-semibold mb-1">Última Atualização:</p>
                    <p className="text-gray-700">{toDate(ticket.updatedAt).toLocaleString('pt-BR')}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Status Change Modal */}
      <AlertDialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <AlertDialogContent>
          <AlertDialogTitle>Alterar Status do Chamado</AlertDialogTitle>
          <AlertDialogDescription>
            Selecione o novo status para o chamado #{ticket?.id}
          </AlertDialogDescription>
          <div className="space-y-4 py-4">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="border-2 border-gray-200">
                <SelectValue placeholder="Selecione o novo status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <AlertDialogCancel className="border-2 border-gray-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleChangeStatus}
              disabled={isSubmitting || !newStatus}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {isSubmitting ? 'Salvando...' : 'Alterar'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Info Modal */}
      <AlertDialog open={showEditModal} onOpenChange={setShowEditModal}>
        <AlertDialogContent className="max-w-xl max-h-96 overflow-auto">
          <AlertDialogTitle>Editar Informações do Chamado</AlertDialogTitle>
          <AlertDialogDescription>
            Atualize a descrição, categoria ou prioridade do chamado
          </AlertDialogDescription>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-2 block">Descrição</label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-teal-400 text-sm resize-none"
                rows={4}
                placeholder="Descrição do problema..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Categoria</label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="border-2 border-gray-200">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Prioridade</label>
                <Select value={editPriority} onValueChange={setEditPriority}>
                  <SelectTrigger className="border-2 border-gray-200">
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <AlertDialogCancel className="border-2 border-gray-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateInfo}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Comment Modal */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Adicionar Comentário Técnico</DialogTitle>
            <DialogDescription>
              Deixe seu comentário técnico sobre o chamado
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <textarea
              autoFocus
              value={commentText}
              onChange={(e) => {
                setCommentText(e.target.value);
              }}
              placeholder="Descreva suas ações, diagnósticos ou orientações técnicas..."
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-teal-400 focus:outline-none focus:ring-0 text-sm resize-none"
              rows={5}
            />
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setShowCommentModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddComment}
              disabled={isSubmitting || !commentText.trim()}
              className="bg-green-500 hover:bg-green-600"
            >
              {isSubmitting ? 'Enviando...' : 'Adicionar Comentário'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
