import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Ticket, TicketPriority, TicketStatus, UserRole } from "@/types";
import { apiGet } from "@/lib/api";
import { ChevronRight, Clock, ClipboardList, AlertTriangle, ChevronDown } from "lucide-react";
import { TicketStatusBadge } from "@/components/TicketStatusBadge";
import { TicketPriorityBadge } from "@/components/TicketPriorityBadge";

const PRIORITY_SLA_HOURS: Record<string, number> = {//SLA em horas conforme prioridade
  low: 48,
  medium: 24,
  high: 8,
  baixa: 48,
  média: 24,
  media: 24,
  alta: 8,
};

const normalizePriority = (p: any): string => (p ? String(p).toLowerCase() : "medium");
const toDate = (v: any): Date => (v instanceof Date ? v : new Date(v));
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function TechnicianDashboard() {//Dashboard específico para técnicos, mostrando métricas e listas relevantes
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandQueueByPriority, setExpandQueueByPriority] = useState(true);
  const [expandSlaDueToday, setExpandSlaDueToday] = useState(true);

  useEffect(() => {// Carrega todos os chamados para técnicos e admins
    const load = async () => {
      try {
        // Técnicos e admins podem ver todos os chamados
        // Tenta diferentes endpoints em order de preferência
        let all;
        try {
          all = await apiGet('/api/chamados/todos');
        } catch (err: any) {
          if (err.status === 405 || err.status === 404) {
            // Se /todos não funcionar, tenta /meus e depois tenta o endpoint geral
            try {
              all = await apiGet('/api/chamados');
            } catch (err2: any) {
              if (err2.status === 405) {
                console.warn('Endpoints indisponíveis, carregando com lista vazia');
                all = [];
              } else {
                throw err2;
              }
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
            const categoria = ticket.categoria ?? ticket.category ?? ticket.idCategoria ?? 'hardware';
            const requesterName = ticket.nome_cliente ?? ticket.nomeCliente ?? ticket.nomeUsuario ?? ticket.requesterName ?? 'Usuário';
            const assigneeName = ticket.nome_tecnico ?? ticket.nomeTecnico ?? ticket.assigneeName ?? '';
            const assigneeId = ticket.id_tecnico ?? ticket.idTecnico ?? ticket.tecnicoId ?? ticket.id_tecnico_atribuido ?? ticket.idTecnicoAtribuido ?? '';
            return {//Mapeia dados brutos para o formato Ticket
              id: finalId,
              title: ticket.titulo || ticket.title || 'Sem título',
              description: ticket.descricao || ticket.description || '',
              status: ticket.status || 'Aberto',
              priority: prioridade,
              category: String(categoria).toLowerCase(),
              createdAt: created,
              updatedAt: updated,
              requesterId: ticket.id_cliente ?? ticket.idCliente ?? ticket.usuarioId ?? '',
              requesterName,
              assigneeId: String(assigneeId),
              assigneeName: assigneeName || 'Não atribuído',
            } as Ticket;// Cria objeto Ticket com dados mapeados
          });
          setTickets(mapped);
        } else {
          setTickets([]);
        }
      } catch (err) {
        console.error('Erro ao carregar chamados:', err);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const myAssigned = useMemo(() => tickets.filter(t => t.assigneeId === user?.id && ![TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status as any)), [tickets, user?.id]);
  const openTickets = useMemo(() => tickets.filter(t => t.status === TicketStatus.OPEN || t.status === ('Aberto' as any)), [tickets]);

  const today = new Date();
  const withDueDate = useMemo(() => tickets.map(t => {
    const created = toDate(t.createdAt);
    const pr = normalizePriority(t.priority);
    const hours = PRIORITY_SLA_HOURS[pr] ?? 24;
    const due = new Date(created.getTime() + hours * 3600 * 1000);
    return { ...t, dueDate: due } as Ticket & { dueDate: Date };
  }), [tickets]);

  const slaDueToday = useMemo(() => withDueDate.filter(t => isSameDay(t.dueDate, today) && ![TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status as any)), [withDueDate]);

  const groupedByPriority = useMemo(() => {// Agrupa chamados por prioridade
    const groups: Record<string, Ticket[]> = { high: [], medium: [], low: [] };
    for (const t of tickets) {
      const pr = normalizePriority(t.priority);// Normaliza prioridade para facilitar agrupamento
      if (pr.includes('high') || pr.includes('alta')) groups.high.push(t);
      else if (pr.includes('low') || pr.includes('baixa')) groups.low.push(t);
      else groups.medium.push(t);
    }
    return groups;
  }, [tickets]);

  const StatCard = ({ title, value, icon, onClick }: { title: string; value: number; icon: React.ReactNode; onClick?: () => void }) => (
    <Card
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' as const : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`group relative overflow-hidden border-2 border-gray-200 bg-white/95 backdrop-blur-sm shadow-lg rounded-xl h-full transition-all duration-300 hover:border-teal-500 hover:shadow-xl hover:scale-105 ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-br from-teal-500/5 via-transparent to-blue-500/5 transition-opacity" />
      <CardHeader className="flex flex-col items-center justify-center space-y-0 pb-2">
        <div className="text-muted-foreground group-hover:text-teal-600 transition-colors mb-2 transform group-hover:scale-110 duration-300">{icon}</div>
        <CardTitle className="text-xs md:text-sm font-medium tracking-wide text-gray-600 group-hover:text-teal-700 transition-colors text-center">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">{value}</div>
      </CardContent>
    </Card>
  );

  const TicketRow = ({ t }: { t: Ticket }) => (
    <button
      onClick={() => navigate(`/tickets/${t.id}`)}
      className="w-full text-left rounded-lg border-2 border-gray-200 bg-white px-4 py-3 hover:border-teal-400 hover:bg-teal-50/30 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="font-semibold text-sm md:text-base text-gray-900 truncate flex-1">{t.title}</span>
        <TicketStatusBadge status={t.status} />
      </div>
      <div className="flex items-center justify-between text-[10px] md:text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <TicketPriorityBadge priority={t.priority as any} />
          <span>Aberto: {toDate(t.createdAt).toLocaleDateString('pt-BR')}</span>
        </div>
        <span className="font-semibold text-teal-600">#{t.id}</span>
      </div>
    </button>
  );
// Layout principal do dashboard do técnico//
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
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent mb-2">
              Dashboard do Técnico
            </h1>
            <p className="text-gray-600">Acompanhe seus chamados e métricas de atendimento</p>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 flex-shrink-0">
          <StatCard
            title="SLA (vence hoje)"//mostra a contagem de chamados com SLA vencendo no dia
            value={slaDueToday.length}
            icon={<Clock size={18} className="text-amber-500" />}
            onClick={() => navigate('/technician/sla-today')}
          />
          <StatCard
            title="Abertos"//mostra a contagem de chamados abertos
            value={openTickets.length}
            icon={<AlertTriangle size={18} className="text-red-500" />}
            onClick={() => navigate('/technician/open')}
          />
          <StatCard
            title="Total"//mostra a contagem total de chamados
            value={tickets.length}
            icon={<ChevronRight size={18} className="text-muted-foreground" />}
          />
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          {/* Fila por prioridade */}
          <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-lg">
            <CardHeader 
              className="pb-3 bg-white/95 backdrop-blur-sm cursor-pointer lg:cursor-default hover:bg-white/98 lg:hover:bg-white/95 transition-colors"
              onClick={() => setExpandQueueByPriority(!expandQueueByPriority)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg">Fila por Prioridade</CardTitle>
                <ChevronDown 
                  size={20} 
                  className={`lg:hidden transition-transform duration-300 ${expandQueueByPriority ? 'rotate-0' : '-rotate-90'}`}
                />
              </div>
            </CardHeader>
            <CardContent 
              className={`grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/95 backdrop-blur-sm transition-all duration-300 overflow-hidden ${
                expandQueueByPriority ? 'max-h-96 md:max-h-none p-6 pt-0' : 'max-h-0 p-0 lg:max-h-96 lg:p-6 lg:pt-0'
              }`}
            >
              {(['high','medium','low'] as const).map(key => (
                <div key={key} className="rounded-lg border-2 border-gray-200 p-3 bg-white hover:border-teal-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium capitalize text-gray-700">{key === 'high' ? 'Alta' : key === 'medium' ? 'Média' : 'Baixa'}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-semibold">{groupedByPriority[key].length}</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {groupedByPriority[key]
                      .slice()
                      .sort((a,b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
                      .slice(0,5)
                      .map(t => (
                        <button key={t.id} onClick={() => navigate(`/technician/ticket/${t.id}`)} className="w-full text-left text-xs hover:text-teal-600 hover:underline transition-colors">
                          #{t.id} · {t.title}
                        </button>
                      ))}
                    {groupedByPriority[key].length === 0 && (
                      <div className="text-xs text-muted-foreground">Sem chamados</div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* SLA do dia - lista */}
          <Card className="flex-1 flex flex-col overflow-hidden border-0 shadow-lg">
            <CardHeader 
              className="pb-3 bg-white/95 backdrop-blur-sm cursor-pointer lg:cursor-default hover:bg-white/98 lg:hover:bg-white/95 transition-colors"
              onClick={() => setExpandSlaDueToday(!expandSlaDueToday)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-base md:text-lg">SLA que vencem hoje</CardTitle>
                <ChevronDown 
                  size={20} 
                  className={`lg:hidden transition-transform duration-300 ${expandSlaDueToday ? 'rotate-0' : '-rotate-90'}`}
                />
              </div>
            </CardHeader>
            <CardContent 
              className={`space-y-3 bg-white/95 backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                expandSlaDueToday ? 'max-h-96 md:max-h-none p-6 pt-0 overflow-auto' : 'max-h-0 p-0 lg:max-h-96 lg:p-6 lg:pt-0 lg:overflow-auto'
              }`}
            >
              {slaDueToday.length === 0 && <div className="text-sm text-muted-foreground">Nenhum SLA vence hoje.</div>}
              {slaDueToday
                .slice()
                .sort((a,b) => (a as any).dueDate.getTime() - (b as any).dueDate.getTime())
                .map(t => (
                  <button
                    key={t.id}
                    onClick={() => navigate(`/technician/ticket/${t.id}`)}
                    className="w-full text-left flex items-center justify-between text-sm p-3 rounded-lg hover:bg-teal-50 hover:shadow-md transition-all duration-300 border border-gray-200/50 hover:border-teal-400"
                  >
                    <div className="min-w-0 flex-1 pr-2 truncate">
                      <span className="font-semibold text-teal-600">#{t.id}</span>
                      <span className="text-gray-700"> · {t.title}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <TicketPriorityBadge priority={t.priority as any} />
                      <span>Vence: {(t as any).dueDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                ))}
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  );
}
