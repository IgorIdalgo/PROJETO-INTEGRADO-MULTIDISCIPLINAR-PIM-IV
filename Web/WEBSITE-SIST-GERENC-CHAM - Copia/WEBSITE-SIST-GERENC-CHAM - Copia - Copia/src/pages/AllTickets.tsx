
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import { Ticket, TicketStatus, TicketCategory, TicketPriority, UserRole } from "@/types";
import { apiGet } from "@/lib/api";
import { Search, PlusCircle, Loader2, ArrowLeft } from "lucide-react";

const ITEMS_PER_PAGE = 7;

export default function AllTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [assignmentFilter, setAssignmentFilter] = useState<string>("all");

  // Fetch tickets
  useEffect(() => {
    const loadTickets = async () => {
      try {
        // Buscar todos os chamados da API
        const allTickets = await apiGet('/api/chamados');
        
        console.log('=== CHAMADOS AllTickets ===');
        console.log('Dados brutos:', allTickets);
        console.log('Primeiro ticket:', allTickets[0]);
        
        if (Array.isArray(allTickets)) {
          // Mapear campos do banco garantindo ID único e datas corretas
          const mappedTickets = allTickets.map((ticket: any, idx: number) => {
            const rawId = ticket.idChamado ?? ticket.id_chamado ?? ticket.id ?? ticket.IdChamado ?? ticket.Id_chamado;
            const finalId = rawId !== undefined && rawId !== null && rawId !== ''
              ? String(rawId)
              : `temp-${idx}-${(ticket.titulo || ticket.title || 'no-title').slice(0,8)}`;

            const created = ticket.dataAbertura ?? ticket.dataabertura ?? ticket.dataCriacao ?? ticket.createdAt;
            const updated = ticket.dataAtualizacao ?? ticket.dataatualizacao ?? ticket.updatedAt;

            const prioridade = ticket.prioridade ?? ticket.urgencia ?? ticket.priority ?? 'Média';
            const categoria = ticket.categoria ?? ticket.category ?? ticket.idCategoria ?? ticket.IdCategoria ?? 'hardware';

            const requesterName = ticket.nome_cliente ?? ticket.nomeCliente ?? ticket.nomeUsuario ?? ticket.requesterName ?? 'Usuário';
            const assigneeName = ticket.nome_tecnico ?? ticket.nomeTecnico ?? ticket.assigneeName ?? ticket.tecnicoNome ?? '';
            const assigneeId = ticket.id_tecnico ?? ticket.idTecnico ?? ticket.tecnicoId ?? ticket.id_tecnico_atribuido ?? ticket.idTecnicoAtribuido;

            if (!rawId) {
              console.warn('[AllTickets] Ticket sem ID detectado. Gerado fallback:', finalId, ticket);
            }

            return {
              id: finalId,
              title: ticket.titulo || ticket.title || 'Sem título',
              description: ticket.descricao || ticket.description || '',
              status: ticket.status || 'Aberto',
              priority: prioridade,
              category: String(categoria).toLowerCase(),
              createdAt: created ? created : new Date(),
              updatedAt: updated ? updated : new Date(),
              requesterId: ticket.id_cliente ?? ticket.idCliente ?? ticket.usuarioId ?? '',
              requesterName,
              assigneeId: assigneeId || '',
              assigneeName: assigneeName || 'Não atribuído'
            } as Ticket;
          });
          
          console.log('Chamados mapeados:', mappedTickets);
          console.log('Primeiro mapeado:', mappedTickets[0]);
          
          setTickets(mappedTickets);
          setFilteredTickets(mappedTickets);
        } else {
          setTickets([]);
          setFilteredTickets([]);
        }
      } catch (error) {
        console.error("Failed to load tickets:", error);
        setTickets([]);
        setFilteredTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = tickets;

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(ticket =>
        ticket.title.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        ticket.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(ticket => {
        console.log('Comparando status:', ticket.status, 'com filtro:', statusFilter);
        return ticket.status === statusFilter;
      });
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter(ticket => {
        console.log('Comparando category:', ticket.category, 'com filtro:', categoryFilter);
        return ticket.category === categoryFilter;
      });
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter(ticket => {
        console.log('Comparando priority:', ticket.priority, 'com filtro:', priorityFilter);
        return ticket.priority === priorityFilter;
      });
    }

    // Assignment filter
    if (assignmentFilter === "assigned_to_me" && user) {
      result = result.filter(ticket => ticket.assigneeId === user.id);
    } else if (assignmentFilter === "unassigned") {
      result = result.filter(ticket => !ticket.assigneeId);
    } else if (assignmentFilter === "assigned_to_others" && user) {
      result = result.filter(ticket => ticket.assigneeId && ticket.assigneeId !== user.id);
    }

    console.log('Tickets após filtros:', result.length, 'de', tickets.length);
    setFilteredTickets(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, categoryFilter, priorityFilter, assignmentFilter, tickets, user]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(1, page), totalPages));
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Primeira página
    if (startPage > 1) {
      items.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => goToPage(1)} className="text-xs sm:text-sm">1</PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis className="text-xs sm:text-sm" />
          </PaginationItem>
        );
      }
    }

    // Páginas do meio
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => goToPage(i)}
            isActive={currentPage === i}
            className="text-xs sm:text-sm px-2 sm:px-3"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Última página
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis className="text-xs sm:text-sm" />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => goToPage(totalPages)} className="text-xs sm:text-sm">{totalPages}</PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  if (!user || (user.role !== UserRole.TECHNICIAN && user.role !== UserRole.ADMINISTRATOR)) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground mb-4">
          Você não tem permissão para acessar esta página.
        </p>
        <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
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
        <div className="max-w-7xl w-full mx-auto flex flex-col h-full overflow-auto gap-6">
          {/* Header */}
          <div className="flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-3">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="shrink-0 hover:bg-teal-100"
                  title="Voltar"
                >
                  <ArrowLeft className="w-5 h-5 text-teal-600" />
                </Button>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Todos os Chamados
                </h1>
              </div>
              {user.role !== UserRole.ADMINISTRATOR && (
                <Button 
                  onClick={() => navigate("/new-ticket")}
                  className="w-full sm:w-auto bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Novo Chamado
                </Button>
              )}
            </div>
            <p className="text-gray-600">Gerencie e acompanhe todos os chamados do sistema</p>
          </div>

          {/* Filters */}
          <div className="flex-shrink-0">
            <Card className="p-4 md:p-6 border-0 shadow-lg bg-white/95 backdrop-blur-sm">
              <div className="grid grid-cols-1 gap-3 md:gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar chamados..."
                      className="pl-10 border-gray-200 hover:border-teal-300 focus:border-teal-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="border-gray-200 hover:border-teal-300">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value={TicketStatus.OPEN}>Aberto</SelectItem>
                      <SelectItem value={TicketStatus.IN_PROGRESS}>Em Andamento</SelectItem>
                      <SelectItem value={TicketStatus.RESOLVED}>Resolvido</SelectItem>
                      <SelectItem value={TicketStatus.CLOSED}>Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Categoria</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="border-gray-200 hover:border-teal-300">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value={TicketCategory.HARDWARE}>Hardware</SelectItem>
                      <SelectItem value={TicketCategory.SOFTWARE}>Software</SelectItem>
                      <SelectItem value={TicketCategory.NETWORK}>Rede</SelectItem>
                      <SelectItem value={TicketCategory.PRINTER}>Impressora</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Prioridade</label>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="border-gray-200 hover:border-teal-300">
                      <SelectValue placeholder="Prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value={TicketPriority.LOW}>Baixa</SelectItem>
                      <SelectItem value={TicketPriority.MEDIUM}>Média</SelectItem>
                      <SelectItem value={TicketPriority.HIGH}>Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-600 mb-2 block">Atribuição</label>
                  <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
                    <SelectTrigger className="border-gray-200 hover:border-teal-300">
                      <SelectValue placeholder="Atribuição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Atribuições</SelectItem>
                      <SelectItem value="assigned_to_me">Atribuídos a Mim</SelectItem>
                      <SelectItem value="unassigned">Não Atribuídos</SelectItem>
                      <SelectItem value="assigned_to_others">Atribuídos a Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Tickets List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              </div>
            ) : filteredTickets.length > 0 ? (
              <>
                {/* Pagination - Top */}
                {totalPages > 1 && (
                  <div className="flex-shrink-0 mb-4 md:mb-6 flex flex-col items-center gap-2 md:gap-3 px-2">
                    <Pagination>
                      <PaginationContent className="flex-wrap justify-center gap-1 sm:gap-2">
                        <PaginationItem>
                          <PaginationPrevious 
                            onClick={() => goToPage(currentPage - 1)}
                            className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} text-xs sm:text-sm px-2 sm:px-3`}
                          />
                        </PaginationItem>
                        
                        {renderPaginationItems()}
                        
                        <PaginationItem>
                          <PaginationNext 
                            onClick={() => goToPage(currentPage + 1)}
                            className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} text-xs sm:text-sm px-2 sm:px-3`}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                    
                    <div className="text-xs sm:text-sm text-muted-foreground text-center">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTickets.length)} de {filteredTickets.length} chamados
                    </div>
                  </div>
                )}

                <div className="flex-1 overflow-auto space-y-3 md:space-y-4">
                  <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-3 font-semibold text-sm text-gray-700 bg-white/70 backdrop-blur-sm rounded-lg sticky top-0 z-10 border-b-2 border-gray-200">
                    <div className="col-span-1">ID</div>
                    <div className="col-span-3">Título</div>
                    <div className="col-span-2">Solicitante</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-center">Prioridade</div>
                    <div className="col-span-1 text-center">Categoria</div>
                    <div className="col-span-2">Atribuído</div>
                    <div className="col-span-1 text-right">Criado</div>
                  </div>
                  
                  {currentTickets.map((ticket) => (
                    <div 
                      key={ticket.id}
                      className="border-2 border-gray-200 rounded-lg hover:border-teal-400 hover:shadow-lg hover:bg-teal-50/30 cursor-pointer transition-all duration-300 group"
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    >
                      {/* Desktop view */}
                      <div className="hidden lg:grid grid-cols-12 gap-4 px-4 py-4">
                        <div className="col-span-1 font-mono text-sm font-semibold text-teal-600 self-center">#{ticket.id}</div>
                        <div className="col-span-3 font-medium text-gray-900 self-center truncate group-hover:text-teal-600">{ticket.title}</div>
                        <div className="col-span-2 text-gray-700 self-center truncate">{ticket.requesterName}</div>
                        <div className="col-span-1 text-center self-center">
                          <TicketStatusBadge status={ticket.status} />
                        </div>
                        <div className="col-span-1 text-center self-center">
                          <TicketPriorityBadge priority={ticket.priority} />
                        </div>
                        <div className="col-span-1 text-center self-center capitalize text-gray-600 font-medium">{ticket.category}</div>
                        <div className="col-span-2 text-gray-700 self-center truncate">
                          {ticket.assigneeName || "Não atribuído"}
                        </div>
                        <div className="col-span-1 text-right self-center text-sm text-gray-500">
                          {new Date(ticket.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Mobile/Tablet view */}
                      <div className="lg:hidden p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-mono text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-1 rounded">#{ticket.id}</span>
                              <TicketStatusBadge status={ticket.status} />
                            </div>
                            <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate group-hover:text-teal-600">{ticket.title}</h3>
                          </div>
                          <TicketPriorityBadge priority={ticket.priority} />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600 text-xs">Solicitante</span>
                            <p className="font-medium text-gray-900 truncate">{ticket.requesterName}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600 text-xs">Categoria</span>
                            <p className="font-medium text-gray-900 capitalize">{ticket.category}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600 text-xs">Atribuído</span>
                            <p className="font-medium text-gray-900 truncate">{ticket.assigneeName || "Não atribuído"}</p>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600 text-xs">Criado</span>
                            <p className="font-medium text-gray-900">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <p className="text-lg text-gray-600 mb-2">Nenhum chamado encontrado</p>
                  <p className="text-sm text-gray-500">com os filtros aplicados.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
