
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
import { Card } from "@/components/ui/card";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";
import { Ticket, TicketStatus, TicketCategory } from "@/types";
import { apiGet } from "@/lib/api";
import { Search, PlusCircle, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

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

// Convert backend category ID to category name
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
    // If it's already a string, return as is
    return category;
  }
  return 'Outro';
};

export default function MyTickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  // Fetch tickets
  useEffect(() => {
    const loadTickets = async () => {
      try {
        // Use /api/chamados/meus endpoint which is the correct one for logged-in user's tickets
        console.log("Loading user's tickets from /api/chamados/meus");
        const allTickets = await apiGet(`/api/chamados/meus`);

        if (Array.isArray(allTickets)) {
          const mappedTickets = allTickets.map((ticket: any, idx: number) => {
            const rawId = ticket.idChamado ?? ticket.id_chamado ?? ticket.IdChamado ?? ticket.id;
            const id = rawId ? String(rawId) : `temp-${idx}`;
            return {
              id,
              title: ticket.titulo || ticket.title || "Sem título",
              description: ticket.descricao || ticket.description || "",
              status: convertBackendStatus(ticket.status),
              priority: ticket.prioridade || ticket.urgencia || ticket.priority || "Média",
              category: convertBackendCategory(ticket.idCategoria ?? ticket.categoria ?? ticket.category ?? 0),
              createdAt: ticket.dataAbertura ?? ticket.dataabertura ?? ticket.dataCriacao ?? ticket.createdAt ?? new Date(),
              updatedAt: ticket.dataAtualizacao ?? ticket.dataatualizacao ?? ticket.updatedAt ?? new Date(),
              requesterId: ticket.idCliente ?? ticket.id_cliente ?? ticket.usuarioId ?? ticket.requesterId ?? ticket.UsuarioId,
              requesterName: ticket.nomeUsuario || ticket.requesterName,
              assigneeId: ticket.idTecnicoAtribuido ?? ticket.id_tecnico_atribuido ?? ticket.id_tecnico ?? ticket.tecnicoId ?? ticket.assigneeId,
              assigneeName: ticket.nomeTecnico || ticket.assigneeName,
            };
          });

          console.log(`Successfully loaded ${mappedTickets.length} tickets`);
          setTickets(mappedTickets);
          setFilteredTickets(mappedTickets);
        } else {
          console.warn("No tickets returned from API");
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
      result = result.filter(
        (ticket) =>
          ticket.title.toLowerCase().includes(query) ||
          ticket.description.toLowerCase().includes(query) ||
          ticket.id.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((ticket) => ticket.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      result = result.filter((ticket) => ticket.category === categoryFilter);
    }

    // Sort by creation date (newest first)
    const sorted = [...result].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return db - da;
    });

    setFilteredTickets(sorted);
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter, tickets]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-teal-50 overflow-hidden pt-14 md:pt-16 md:ml-16 lg:ml-20">
      {/* Decorative elements */}
      <div className="absolute top-20 md:top-24 right-0 w-96 h-96 bg-gradient-to-br from-blue-200/20 to-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-teal-200/20 to-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      {/* Content */}
      <div className="relative w-full h-full flex flex-col p-4 md:p-8 overflow-hidden">
        <div className="max-w-7xl w-full mx-auto flex flex-col h-full overflow-auto gap-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 flex-shrink-0">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-1">
                Meus Chamados
              </h1>
              <p className="text-sm md:text-base text-gray-600">Acompanhe seus tickets de suporte</p>
            </div>
            <Button 
              onClick={() => navigate("/new-ticket")}
              className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white h-11 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 whitespace-nowrap"
            >
              <PlusCircle size={18} className="mr-2" />
              Novo Chamado
            </Button>
          </div>

          {/* Filters */}
          <Card className="p-4 md:p-6 flex-shrink-0 border-0 shadow-lg bg-white/95 backdrop-blur-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-teal-600" />
                  <Input
                    placeholder="Buscar por título ou ID..."
                    className="pl-10 h-10 border-2 border-gray-200 rounded-lg focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 border-2 border-gray-200 rounded-lg focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-colors">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="Aberto">Aberto</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Resolvido">Resolvido</SelectItem>
                    <SelectItem value="Fechado">Fechado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700 mb-2 block">Categoria</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-10 border-2 border-gray-200 rounded-lg focus:border-teal-600 focus:ring-2 focus:ring-teal-200 transition-colors">
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Categorias</SelectItem>
                    <SelectItem value="Hardware">Hardware</SelectItem>
                    <SelectItem value="Software">Software</SelectItem>
                    <SelectItem value="Rede">Rede</SelectItem>
                    <SelectItem value="Impressora">Impressora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Tickets List */}
          {isLoading ? (
            <div className="flex-1 flex justify-center items-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Carregando seus chamados...</p>
              </div>
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Pagination Top */}
              {Math.ceil(filteredTickets.length / ITEMS_PER_PAGE) > 1 && (
                <div className="flex items-center justify-center gap-2 mb-4 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-2 border-gray-300 hover:bg-gray-100 hover:border-teal-400 transition-all"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {Array.from({ length: Math.min(4, Math.ceil(filteredTickets.length / ITEMS_PER_PAGE)) }, (_, i) => {
                    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
                    const startPage = Math.max(1, Math.min(currentPage - 1, totalPages - 3));
                    return startPage + i;
                  }).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className={`h-9 w-9 p-0 rounded-lg font-semibold transition-all ${
                        currentPage === page
                          ? "bg-teal-600 text-white border-0 hover:bg-teal-700"
                          : "border-2 border-gray-300 text-gray-700 hover:bg-gray-100 hover:border-teal-400"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg border-2 border-gray-300 hover:bg-gray-100 hover:border-teal-400 transition-all"
                    onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredTickets.length / ITEMS_PER_PAGE), p + 1))}
                    disabled={currentPage === Math.ceil(filteredTickets.length / ITEMS_PER_PAGE)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Tickets */}
              <div className="flex-1 overflow-auto space-y-3 pr-4">
                <div className="hidden lg:flex flex-col space-y-3">
                  {filteredTickets
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE)
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 border-2 border-gray-200 rounded-lg bg-white/90 backdrop-blur-sm hover:border-teal-400 hover:shadow-lg hover:bg-teal-50/30 cursor-pointer transition-all duration-300"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-gray-900">
                              #{ticket.id} - {ticket.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-1 mt-1">{ticket.description}</p>
                          </div>
                          <TicketStatusBadge status={ticket.status} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600 gap-4 mt-3 pt-3 border-t border-gray-200">
                          <span className="font-medium">Criado em: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="lg:hidden flex flex-col space-y-3">
                  {filteredTickets
                    .slice((currentPage - 1) * ITEMS_PER_PAGE, (currentPage - 1) * ITEMS_PER_PAGE + ITEMS_PER_PAGE)
                    .map((ticket) => (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer border-0 shadow-md hover:shadow-lg transition-all duration-300 p-4 bg-white/95 backdrop-blur-sm"
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="bg-teal-600 text-white text-xs font-bold px-2 py-1 rounded">#{ticket.id}</span>
                            </div>
                            <h3 className="font-bold text-sm text-gray-900 line-clamp-1">
                              {ticket.title}
                            </h3>
                            <p className="text-xs text-gray-600 line-clamp-1 mt-1">{ticket.description}</p>
                          </div>
                          <TicketStatusBadge status={ticket.status} />
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-600 pt-2 border-t border-gray-200">
                          <span>Criado: {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-200 to-teal-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusCircle className="h-10 w-10 text-teal-600" />
                </div>
                <p className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                  Nenhum chamado encontrado
                </p>
                <p className="text-sm md:text-base text-gray-600 mb-6 max-w-sm">
                  Você ainda não possui chamados. Clique em "Novo Chamado" para criar o seu primeiro.
                </p>
                <Button 
                  onClick={() => navigate("/new-ticket")}
                  className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white h-11 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <PlusCircle size={18} className="mr-2" />
                  Criar Primeiro Chamado
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
