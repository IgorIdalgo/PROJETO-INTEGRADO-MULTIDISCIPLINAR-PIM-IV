import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
import { Ticket, TicketStatus, TicketPriority, TicketCategory, UserRole, Comment } from "@/types";
import { apiGet, apiPut, apiPost } from "@/lib/api";
import { 
  Search, 
  Filter, 
  Eye, 
  UserPlus, 
  MessageSquare, 
  Edit2,
  Check,
  Clock,
  AlertTriangle,
  X,
  ChevronDown,
  Send,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";

const STATUS_LABELS: Record<string, string> = {
  "Aberto": "Aberto",
  "open": "Aberto",
  "Em Andamento": "Em Andamento",
  "in_progress": "Em Andamento",
  "Aguardando Usuário": "Aguardando Usuário",
  "waiting_info": "Aguardando Usuário",
  "Resolvido": "Resolvido",
  "resolved": "Resolvido",
  "Fechado": "Fechado",
  "closed": "Fechado",
  "0": "Aberto",
  "1": "Em Andamento",
  "2": "Resolvido",
  "3": "Fechado",
  "EmAtendimento": "Em Andamento",
};

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

// Convert backend category (numeric ID) to Portuguese category name
const convertBackendCategory = (category: any): string => {
  if (typeof category === 'number') {
    const categoryMap: Record<number, string> = {
      1: 'Hardware',
      2: 'Software',
      3: 'Rede',
      4: 'Impressora',
      0: 'Outro'
    };
    return categoryMap[category] || 'Outro';
  }
  if (typeof category === 'string') {
    const categoryLower = category.toLowerCase();
    if (categoryLower === 'hardware' || categoryLower === '1') return 'Hardware';
    if (categoryLower === 'software' || categoryLower === '2') return 'Software';
    if (categoryLower === 'rede' || categoryLower === '3') return 'Rede';
    if (categoryLower === 'impressora' || categoryLower === '4') return 'Impressora';
    return 'Outro';
  }
  return 'Outro';
};

const STATUS_OPTIONS = [
  { value: "Aberto", label: "Aberto" },
  { value: "Em Andamento", label: "Em Andamento" },
  { value: "Resolvido", label: "Resolvido" },
  { value: "Fechado", label: "Fechado" },
];

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
  { value: "Crítica", label: "Crítica" },
];

const toDate = (v: any): Date => (v instanceof Date ? v : new Date(v));

export default function TicketManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [filterCategory, setFilterCategory] = useState("Todas");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [commentText, setCommentText] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editPriority, setEditPriority] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const selectedTicket = useMemo(
    () => tickets.find(t => t.id === selectedTicketId),
    [tickets, selectedTicketId]
  );

  // Load tickets from database
  const loadTickets = async () => {
    try {
      let all;
      try {
        all = await apiGet('/api/chamados/todos');
      } catch (err: any) {
        if (err.status === 405 || err.status === 404) {
          try {
            all = await apiGet('/api/chamados');
          } catch (err2: any) {
            all = [];
          }
        } else {
          throw err;
        }
      }
      
      if (Array.isArray(all)) {
        const mapped = all.map((ticket: any, idx: number) => {
          const rawId = ticket.idChamado ?? ticket.id_chamado ?? ticket.id ?? ticket.IdChamado ?? ticket.Id_chamado;
          const finalId = rawId !== undefined && rawId !== null && rawId !== '' ? String(rawId) : `temp-${idx}`;
          const created = ticket.dataAbertura ?? ticket.dataabertura ?? ticket.dataCriacao ?? ticket.createdAt ?? new Date();
          const updated = ticket.dataAtualizacao ?? ticket.dataatualizacao ?? ticket.updatedAt ?? created;
          const prioridade = ticket.prioridade ?? ticket.urgencia ?? ticket.priority ?? 'Média';
          const categoria = convertBackendCategory(ticket.categoria ?? ticket.category ?? ticket.idCategoria ?? 'Outro');
          const requesterName = ticket.nome_cliente ?? ticket.nomeCliente ?? ticket.nomeUsuario ?? ticket.requesterName ?? 'Usuário';
          const assigneeName = ticket.nome_tecnico ?? ticket.nomeTecnico ?? ticket.assigneeName ?? '';
          const assigneeId = ticket.id_tecnico ?? ticket.idTecnico ?? ticket.tecnicoId ?? ticket.id_tecnico_atribuido ?? ticket.idTecnicoAtribuido ?? '';
          
          return {
            id: finalId,
            title: ticket.titulo || ticket.title || 'Sem título',
            description: ticket.descricao || ticket.description || '',
            status: convertBackendStatus(ticket.status),
            priority: prioridade,
            category: categoria,
            createdAt: created,
            updatedAt: updated,
            requesterId: ticket.id_cliente ?? ticket.idCliente ?? ticket.usuarioId ?? '',
            requesterName,
            assigneeId: String(assigneeId),
            assigneeName: assigneeName || 'Não atribuído',
            comments: ticket.comentarios ?? [],
          } as Ticket;
        });
        setTickets(mapped);
      } else if (all && typeof all === 'object' && (all.data || all.tickets || all.items)) {
        // Se a resposta é um objeto com um array dentro
        const ticketArray = all.data ?? all.tickets ?? all.items ?? [];
        const mapped = ticketArray.map((ticket: any, idx: number) => {
          const rawId = ticket.idChamado ?? ticket.id_chamado ?? ticket.id ?? ticket.IdChamado ?? ticket.Id_chamado;
          const finalId = rawId !== undefined && rawId !== null && rawId !== '' ? String(rawId) : `temp-${idx}`;
          const created = ticket.dataAbertura ?? ticket.dataabertura ?? ticket.dataCriacao ?? ticket.createdAt ?? new Date();
          const updated = ticket.dataAtualizacao ?? ticket.dataatualizacao ?? ticket.updatedAt ?? created;
          const prioridade = ticket.prioridade ?? ticket.urgencia ?? ticket.priority ?? 'Média';
          const categoria = convertBackendCategory(ticket.categoria ?? ticket.category ?? ticket.idCategoria ?? 'Outro');
          const requesterName = ticket.nome_cliente ?? ticket.nomeCliente ?? ticket.nomeUsuario ?? ticket.requesterName ?? 'Usuário';
          const assigneeName = ticket.nome_tecnico ?? ticket.nomeTecnico ?? ticket.assigneeName ?? '';
          const assigneeId = ticket.id_tecnico ?? ticket.idTecnico ?? ticket.tecnicoId ?? ticket.id_tecnico_atribuido ?? ticket.idTecnicoAtribuido ?? '';
          
          return {
            id: finalId,
            title: ticket.titulo || ticket.title || 'Sem título',
            description: ticket.descricao || ticket.description || '',
            status: convertBackendStatus(ticket.status),
            priority: prioridade,
            category: categoria,
            createdAt: created,
            updatedAt: updated,
            requesterId: ticket.id_cliente ?? ticket.idCliente ?? ticket.usuarioId ?? '',
            requesterName,
            assigneeId: String(assigneeId),
            assigneeName: assigneeName || 'Não atribuído',
            comments: ticket.comentarios ?? [],
          } as Ticket;
        });
        setTickets(mapped);
      } else {
        setTickets([]);
      }
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
      setTickets([]);
    }
  };

  // Refresh tickets
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTickets();
    } finally {
      setRefreshing(false);
    }
  };

  // Load tickets on mount
  useEffect(() => {
    const initLoad = async () => {
      try {
        await loadTickets();
      } finally {
        setLoading(false);
      }
    };
    initLoad();
  }, []);

  // Filters
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.id.toString().includes(searchTerm);
      const matchStatus = filterStatus === "Todos" || STATUS_LABELS[t.status] === filterStatus;
      const matchCategory = filterCategory === "Todas" || 
                           t.category === filterCategory;
      return matchSearch && matchStatus && matchCategory;
    });
  }, [tickets, searchTerm, filterStatus, filterCategory]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedTickets = filteredTickets
    .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
    .slice(startIndex, endIndex);

  // Assign ticket to self
  const handleAssignToMe = async () => {
    if (!selectedTicket) return;
    
    setIsSubmitting(true);
    try {
      await apiPut(`/api/chamados/${selectedTicket.id}/assign`, {
        tecnicoId: user?.id,
        tecnico: user?.name,
      });
      
      // Update local state
      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, assigneeId: user?.id, assigneeName: user?.name }
          : t
      ));
      setShowAssignModal(false);
    } catch (err) {
      console.error('Erro ao atribuir chamado:', err);
      alert('Erro ao atribuir chamado');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change status
  const handleChangeStatus = async () => {
    if (!selectedTicket || !newStatus) return;

    setIsSubmitting(true);
    try {
      // Send complete chamado object with all required fields
      const updatedChamado = {
        id: selectedTicket.id,
        titulo: selectedTicket.title,
        descricao: selectedTicket.description,
        status: newStatus,
        prioridade: selectedTicket.priority,
        categoria: selectedTicket.category,
        dataAbertura: selectedTicket.createdAt,
        usuarioId: selectedTicket.requesterId,
        tecnicoId: selectedTicket.assigneeId || null,
      };

      await apiPut(`/api/chamados/${selectedTicket.id}`, updatedChamado);

      setTickets(prev => prev.map(t => 
        t.id === selectedTicket.id 
          ? { ...t, status: newStatus as TicketStatus }
          : t
      ));
      setShowStatusChangeModal(false);
      setNewStatus("");
      alert('Status alterado com sucesso!');
    } catch (err) {
      console.error('Erro ao alterar status:', err);
      alert('Erro ao alterar status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add comment
  const handleAddComment = async () => {
    if (!selectedTicket || !commentText.trim()) return;

    setIsSubmitting(true);
    try {
      await apiPost(`/api/chamados/${selectedTicket.id}/comments`, {
        content: commentText,
        authorId: user?.id,
        authorName: user?.name,
        authorRole: user?.role,
        isPublic: false,
      });

      // Update local state
      const newComment = {
        id: `temp-${Date.now()}`,
        content: commentText,
        createdAt: new Date(),
        authorId: user?.id || '',
        authorName: user?.name || '',
        authorRole: user?.role || UserRole.TECHNICIAN,
        ticketId: selectedTicket.id,
        isPublic: false,
      };

      setTickets(prev => prev.map(t =>
        t.id === selectedTicket.id
          ? {
              ...t,
              comments: [...(t.comments || []), newComment as Comment],
            }
          : t
      ));
      
      setCommentText("");
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      alert('Erro ao adicionar comentário');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update ticket info
  const handleUpdateTicketInfo = async () => {
    if (!selectedTicket) return;

    setIsSubmitting(true);
    try {
      // Send complete chamado object with all required fields
      const updatedChamado = {
        id: selectedTicket.id,
        titulo: selectedTicket.title,
        descricao: editDescription || selectedTicket.description,
        status: selectedTicket.status,
        prioridade: editPriority || selectedTicket.priority,
        categoria: editCategory || selectedTicket.category,
        dataAbertura: selectedTicket.createdAt,
        usuarioId: selectedTicket.requesterId,
        tecnicoId: selectedTicket.assigneeId || null,
      };

      await apiPut(`/api/chamados/${selectedTicket.id}`, updatedChamado);

      setTickets(prev => prev.map(t =>
        t.id === selectedTicket.id
          ? {
              ...t,
              description: editDescription || t.description,
              category: (editCategory || t.category) as TicketCategory,
              priority: (editPriority || t.priority) as TicketPriority,
            }
          : t
      ));

      setShowEditModal(false);
      setEditDescription("");
      setEditCategory("");
      setEditPriority("");
      alert('Informações atualizadas com sucesso!');
    } catch (err) {
      console.error('Erro ao atualizar chamado:', err);
      alert('Erro ao atualizar chamado');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTicketDetail = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setShowDetailModal(true);
    
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      setEditDescription(ticket.description);
      setEditCategory(ticket.category);
      setEditPriority(ticket.priority);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 pt-14 md:pt-16 md:ml-16 lg:ml-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando chamados...</p>
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
        <div className="max-w-7xl w-full mx-auto flex flex-col h-full overflow-hidden gap-6">
          {/* Header */}
          <div className="flex-shrink-0 flex justify-between items-start">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
                Gerenciamento de Chamados
              </h1>
              <p className="text-gray-600">Gerencie, analise e resolva chamados</p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              size="sm"
              variant="outline"
              className="border-2 border-teal-400 text-teal-600 hover:bg-teal-50 gap-2"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Recarregando...' : 'Recarregar'}
            </Button>
          </div>

          {/* Filters and Search */}
          <div className="flex-shrink-0 grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <Input
                placeholder="Buscar por ID ou título..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-2 border-gray-200 focus:border-teal-400"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="border-2 border-gray-200 focus:border-teal-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                {STATUS_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="border-2 border-gray-200 focus:border-teal-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas as Categorias</SelectItem>
                {CATEGORY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tickets Table */}
          <div className="flex-1 overflow-hidden rounded-lg border-2 border-gray-200 bg-white/95 backdrop-blur-sm flex flex-col">
            <div className="overflow-x-auto overflow-y-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="sticky top-0 bg-gradient-to-r from-teal-50 to-blue-50 border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700 w-16">ID</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700 flex-1">Título</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700 w-32">Cliente</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700 w-24">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700 w-24">Prioridade</th>
                    <th className="px-4 py-3 text-left font-semibold text-sm text-gray-700 w-20">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        Nenhum chamado encontrado
                      </td>
                    </tr>
                  ) : (
                    paginatedTickets.map(ticket => (
                      <tr key={ticket.id} className="border-b border-gray-100 hover:bg-teal-50/30 transition-colors cursor-pointer" onClick={() => navigate(`/technician/ticket/${ticket.id}`)}>
                        <td className="px-4 py-4 font-semibold text-teal-600">#{ticket.id}</td>
                        <td className="px-4 py-4 truncate text-sm text-gray-900">{ticket.title}</td>
                        <td className="px-4 py-4 truncate text-sm text-gray-600">{ticket.requesterName}</td>
                        <td className="px-4 py-4">
                          <TicketStatusBadge status={ticket.status} />
                        </td>
                        <td className="px-4 py-4">
                          <TicketPriorityBadge priority={ticket.priority as any} />
                        </td>
                        <td className="px-4 py-4 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/technician/ticket/${ticket.id}`);
                            }}
                            className="border-teal-400 text-teal-600 hover:bg-teal-50 whitespace-nowrap"
                          >
                            <Eye size={16} />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Results count */}
          <div className="flex-shrink-0 text-sm text-gray-600">
            Exibindo {paginatedTickets.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredTickets.length)} de {filteredTickets.length} chamados
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex-shrink-0 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="border-teal-400 text-teal-600 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </Button>
              
              <div className="flex items-center gap-1">
                {(() => {
                  // Calculate range of pages to show (max 3)
                  let startPage = Math.max(1, currentPage - 1);
                  let endPage = Math.min(totalPages, startPage + 2);
                  
                  // Adjust if we're near the end
                  if (endPage - startPage < 2) {
                    startPage = Math.max(1, endPage - 2);
                  }
                  
                  return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={currentPage === page 
                        ? "bg-teal-600 text-white hover:bg-teal-700" 
                        : "border-teal-400 text-teal-600 hover:bg-teal-50"
                      }
                    >
                      {page}
                    </Button>
                  ));
                })()}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="border-teal-400 text-teal-600 hover:bg-teal-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      <AlertDialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <AlertDialogContent className="max-w-2xl max-h-96 overflow-auto">
          <AlertDialogTitle className="text-xl">
            Detalhes do Chamado #{selectedTicket?.id}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Informações completas do chamado selecionado
          </AlertDialogDescription>

          {selectedTicket && (
            <div className="space-y-4">
              {/* Info Section */}
              <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                <div>
                  <p className="text-xs text-gray-500 font-semibold">TÍTULO</p>
                  <p className="font-semibold text-gray-900">{selectedTicket.title}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">CLIENTE</p>
                  <p className="font-semibold text-gray-900">{selectedTicket.requesterName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">STATUS</p>
                  <TicketStatusBadge status={selectedTicket.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">PRIORIDADE</p>
                  <TicketPriorityBadge priority={selectedTicket.priority as any} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">CRIADO EM</p>
                  <p className="text-sm text-gray-600">{toDate(selectedTicket.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold">ATRIBUÍDO A</p>
                  <p className="font-semibold text-gray-900">{selectedTicket.assigneeName || 'Não atribuído'}</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-2">DESCRIÇÃO</p>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 max-h-24 overflow-auto">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Comments */}
              <div>
                <p className="text-xs text-gray-500 font-semibold mb-2">COMENTÁRIOS TÉCNICOS</p>
                <div className="space-y-2 max-h-32 overflow-auto mb-3">
                  {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                    selectedTicket.comments.map(comment => (
                      <div key={comment.id} className="bg-blue-50 p-3 rounded-lg border-l-4 border-teal-400">
                        <p className="text-xs font-semibold text-teal-700">{comment.authorName}</p>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                        <p className="text-xs text-gray-500 mt-1">{toDate(comment.createdAt).toLocaleString('pt-BR')}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Nenhum comentário ainda</p>
                  )}
                </div>

                {/* Add Comment */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Adicionar comentário técnico..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleAddComment}
                    disabled={isSubmitting || !commentText.trim()}
                    className="bg-gradient-to-r from-teal-500 to-blue-600"
                  >
                    <Send size={16} />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              onClick={() => {
                setShowDetailModal(false);
                setShowStatusChangeModal(true);
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600"
              disabled={!selectedTicket || selectedTicket.assigneeId !== user?.id}
            >
              <Check size={16} className="mr-2" />
              Alterar Status
            </Button>
            <Button
              onClick={() => {
                setShowDetailModal(false);
                setShowEditModal(true);
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-600"
            >
              <Edit2 size={16} className="mr-2" />
              Editar Info
            </Button>
            {!selectedTicket?.assigneeId && (
              <Button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowAssignModal(true);
                }}
                className="flex-1 bg-teal-500 hover:bg-teal-600"
              >
                <UserPlus size={16} className="mr-2" />
                Atribuir a Mim
              </Button>
            )}
            <AlertDialogCancel className="border-2 border-gray-300">Fechar</AlertDialogCancel>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Modal */}
      <AlertDialog open={showAssignModal} onOpenChange={setShowAssignModal}>
        <AlertDialogContent>
          <AlertDialogTitle>Atribuir Chamado a Você?</AlertDialogTitle>
          <AlertDialogDescription>
            Deseja assumir o chamado #{selectedTicket?.id} - {selectedTicket?.title}?
          </AlertDialogDescription>
          <div className="flex gap-2">
            <AlertDialogCancel className="border-2 border-gray-300">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAssignToMe}
              disabled={isSubmitting}
              className="bg-teal-500 hover:bg-teal-600"
            >
              {isSubmitting ? 'Atribuindo...' : 'Atribuir'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Change Modal */}
      <AlertDialog open={showStatusChangeModal} onOpenChange={setShowStatusChangeModal}>
        <AlertDialogContent>
          <AlertDialogTitle>Alterar Status do Chamado</AlertDialogTitle>
          <AlertDialogDescription>
            Selecione o novo status para o chamado
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

      {/* Edit Modal */}
      <AlertDialog open={showEditModal} onOpenChange={setShowEditModal}>
        <AlertDialogContent className="max-w-xl">
          <AlertDialogTitle>Editar Informações do Chamado</AlertDialogTitle>
          <AlertDialogDescription>
            Atualize a descrição, categoria ou prioridade
          </AlertDialogDescription>
          <div className="space-y-4 py-4 max-h-96 overflow-auto">
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
                    <SelectValue placeholder="Selecione categoria" />
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
                    <SelectValue placeholder="Selecione prioridade" />
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
              onClick={handleUpdateTicketInfo}
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
