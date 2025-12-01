//dashboard colaborador

//hoooks básicos React
import { useState, useEffect } from "react"; 
import { useAuth } from "@/contexts/AuthContext";
import { FileText, Clock, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react"; //ícones Lucide-React
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Button } from "@/components/ui/button";
import { UserRole, Ticket, TicketStatus } from "@/types"; //define papéis de usuário e tipos de ticket
import { getTickets } from "@/services/dataService";//estrutura para buscar dados de tickets da API
import { TicketStatusBadge } from "@/components/TicketStatusBadge";//componente para exibir o status do ticket(aberto, andamento, etc)
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user } = useAuth();//pega dados do usuário logado
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate(); //hook para navegação entre páginas
  const ITEMS_PER_PAGE = 6;

  const loadTickets = async () => {
    try {
      const all = await getTickets();
      console.log('=== CHAMADOS RETORNADOS ===');
      console.log('Dados brutos:', all);
      console.log('É array?', Array.isArray(all));
      console.log('Quantidade:', Array.isArray(all) ? all.length : 'não é array');
      
      // Ordenar por data de criação (mais recentes primeiro)
      const sortedTickets = Array.isArray(all) 
        ? all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      
      setTickets(sortedTickets);
      setError(null);
    } catch (e: any) {
      console.error("Erro ao carregar chamados", e);
      if (user?.role === UserRole.COLLABORATOR) {
        setError("Não foi possível carregar os chamados. Tente novamente.");
      } else {
        setError(e?.message || "Falha ao carregar chamados");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    
    // Atualizar a cada 20 segundos
    const interval = setInterval(() => {
      loadTickets();
    }, 20000);
    
    return () => clearInterval(interval);
  }, [user?.role]);

  // API já retorna "meus" chamados para colaborador. Para outros perfis, usam lógica baseada em assignee
  const myTickets = user?.role === UserRole.COLLABORATOR
    ? tickets
    : tickets.filter(t => t.assigneeId === user?.id);

  const totalCount = myTickets.length;
  const today = new Date();
  const isSameDay = (d: Date) => d.toDateString() === today.toDateString();
  // Contagens diárias conforme API
  // Chamados abertos hoje: considerar a data de criação independente do status atual
  const openedTodayCount = myTickets.filter(t => {
    const created = t.createdAt instanceof Date ? t.createdAt : new Date(t.createdAt);
    return isSameDay(created);
  }).length;
  const inProgressTodayCount = myTickets.filter(t => {
    const updated = new Date(t.updatedAt);
    return t.status === TicketStatus.IN_PROGRESS && isSameDay(updated);
  }).length;
  const resolvedTodayCount = myTickets.filter(t => {
    const updated = new Date(t.updatedAt);
    return (t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED) && isSameDay(updated);
  }).length;
  const waitingResponseCount = myTickets.filter(t => t.status === TicketStatus.WAITING_INFO).length;

  const StatCard = ({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) => (
    <Card className="group relative overflow-hidden bg-white border-2 border-gray-200 shadow-md hover:shadow-lg hover:border-teal-300 transition-all duration-200 h-full rounded-xl">
      <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-3 pt-4">
        <div className="text-gray-400 group-hover:text-teal-500 transition-colors mb-2">{icon}</div>
        <CardTitle className="text-xs md:text-sm font-semibold tracking-wide text-gray-600 group-hover:text-gray-800 transition-colors text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center pb-4">
        <div className="text-3xl md:text-4xl font-bold text-teal-600">{value}</div>
      </CardContent>
    </Card>
  );

  const RecentTicketItem = ({ ticket }: { ticket: Ticket }) => {
    // ID robusto (caso tenha sido extendido em outro fluxo)
    const ticketId = (ticket as any).idChamado || (ticket as any).IdChamado || (ticket as any).id_chamado || ticket.id;
    // Data de abertura (fallback para createdAt já mapeado)
    const openedAt = ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt);
    const openedDateFormatted = openedAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return (
      <button
        onClick={() => navigate(`/tickets/${ticketId}`)}
        className="group w-full text-left rounded-xl border-2 border-gray-200 bg-white px-4 py-4 hover:border-teal-300 hover:bg-blue-50 hover:shadow-lg transition-all duration-200"
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <span className="font-semibold text-sm md:text-base text-gray-800 truncate flex-1 group-hover:text-teal-700">{ticket.title}</span>
          <TicketStatusBadge status={ticket.status} />
        </div>
        <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mb-3">{ticket.description}</p>
        <div className="flex justify-between items-center text-[10px] md:text-xs text-gray-500 border-t border-gray-100 pt-2">
          <span className="uppercase tracking-wide font-bold text-teal-600">#{ticketId}</span>
          <span className="text-gray-500">Aberto: {openedDateFormatted}</span>
        </div>
      </button>
    );
  };

  const RecentTickets = () => {
    const totalPages = Math.ceil(myTickets.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentTickets = myTickets.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    return (
      <Card className="relative overflow-hidden bg-card/95 backdrop-blur-sm border border-border shadow-sm h-full flex flex-col">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-primary/5 via-transparent to-secondary/10" />
        <CardHeader className="pb-3 relative flex-shrink-0">
          <CardTitle className="text-base md:text-lg font-medium text-foreground">Últimos Chamados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative flex-1 overflow-auto">
          {error && (
            <div className="text-sm text-destructive font-medium text-center bg-destructive/10 border border-destructive/30 rounded-md px-4 py-3">
              {error}
            </div>
          )}
          {myTickets.length === 0 && !isLoading && !error && (
            <div className="text-sm text-muted-foreground text-center py-8">Nenhum chamado encontrado.</div>
          )}
          {currentTickets.map((t, index) => (
            <RecentTicketItem key={t.id || `ticket-${index}`} ticket={t} />
          ))}
        </CardContent>
        
        {/* Paginação */}
        {totalPages > 1 && (//se mais de uma página)
          <div className="border-t p-3 flex items-center justify-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "ghost"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            
            <Button 
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col gap-4 p-4 md:p-6">
        <div className="h-8 w-48 rounded-md bg-muted animate-pulse" />
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 md:gap-6">
          <div className="h-full rounded-lg bg-muted animate-pulse" />
          <div className="flex flex-col gap-4">
            <div className="h-16 rounded-lg bg-muted animate-pulse" />
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
              <div className="h-32 rounded-lg bg-muted animate-pulse" />
              <div className="h-32 rounded-lg bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout principal estilo imagem para colaborador
  if (user?.role === UserRole.COLLABORATOR) {
    const totalPages = Math.ceil(myTickets.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentTickets = myTickets.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
      setCurrentPage(page);
    };

    return (
      <div className="w-full h-full flex flex-col overflow-hidden bg-white m-0 p-0 border-0">
        <div className="w-full flex flex-col gap-4 p-4 md:p-6 lg:p-8 h-full m-0">
          <div className="flex-shrink-0">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground m-0 p-0">Últimos Chamados</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1">Acompanhe seus chamados de suporte</p>
          </div>
          
          {/* Layout responsivo: mobile (vertical) e desktop (horizontal) */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 lg:gap-6 overflow-hidden m-0">
            
            {/* Painel principal - Lista de chamados */}
            <div className="flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col relative overflow-hidden bg-white border-2 border-gray-200 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
                <CardHeader className="pb-4 relative flex-shrink-0 space-y-4 border-b-2 border-gray-100">
                  
                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50 hover:text-teal-600"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      
                      {Array.from(
                        { length: Math.min(4, totalPages) },
                        (_, i) => {
                          const startPage = Math.max(1, currentPage - Math.floor(Math.min(4, totalPages) / 2));
                          const endPage = Math.min(totalPages, startPage + Math.min(4, totalPages) - 1);
                          return Math.max(1, endPage - Math.min(4, totalPages) + 1) + i;
                        }
                      ).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "ghost"}
                          size="sm"
                          className={`h-8 w-8 p-0 rounded-lg font-medium transition-all ${
                            currentPage === page
                              ? "bg-teal-500 text-white shadow-md hover:bg-teal-600"
                              : "hover:bg-blue-50 text-gray-700 hover:text-teal-600"
                          }`}
                          onClick={() => handlePageChange(page)}
                        >
                          {page}
                        </Button>
                      ))}
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-50 hover:text-teal-600"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3 relative flex-1 overflow-auto pr-2">
                  {error && (
                    <div className="text-sm text-red-700 font-semibold text-center bg-red-50 border-2 border-red-300 rounded-lg px-4 py-3">
                      {error}
                    </div>
                  )}
                  {myTickets.length === 0 && !isLoading && !error && (
                    <div className="text-sm text-gray-500 text-center py-12 flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-gray-300" />
                      <span>Nenhum chamado encontrado.</span>
                    </div>
                  )}
                  {currentTickets.map((t, index) => (
                    <RecentTicketItem key={t.id || `ticket-${index}`} ticket={t} />
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Painel lateral - Ações e métricas */}
            <div className="flex flex-col gap-4">
            <Button
              className="w-full h-12 md:h-14 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold text-base md:text-lg tracking-wide shadow-lg hover:shadow-xl transition-all rounded-xl border-0"
              onClick={() => navigate('/new-ticket')}
            >
              Abrir Novo Chamado
            </Button>
            
            {/* Cards de estatísticas */}
            <div className="grid grid-cols-1 gap-3">
              <StatCard title="Abertos" value={openedTodayCount} icon={<Clock size={20} className="text-yellow-500" />} />
            </div>
            
            {/* Card de resumo total */}
            <Card className="bg-white border-2 border-gray-200 shadow-md rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-gray-600 text-center">Total de Chamados</CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center pb-4">
                <div className="text-4xl font-bold text-teal-600">{totalCount}</div>
              </CardContent>
            </Card>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Para outros perfis: métricas diárias
  return (
    <div className="w-full h-full flex justify-center items-start overflow-auto">
      <div className="w-full max-w-[1600px] flex flex-col gap-6 p-6 md:p-8 lg:p-10">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground">Dashboard</h1>
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Abertos Hoje" value={openedTodayCount} icon={<FileText size={20} className="text-yellow-400" />} />
          <StatCard title="Em Andamento Hoje" value={inProgressTodayCount} icon={<Clock size={20} className="text-teal-500" />} />
          <StatCard title="Resolvidos Hoje" value={resolvedTodayCount} icon={<CheckCircle size={20} className="text-green-500" />} />
        </div>
        
        <div className="flex-1 min-h-[600px]">
          <RecentTickets />
        </div>
      </div>
    </div>
  );
}
