import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet } from '@/lib/api';
import { Ticket, TicketStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketStatusBadge } from '@/components/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/TicketPriorityBadge';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const PRIORITY_SLA_HOURS: Record<string, number> = { low: 48, medium: 24, high: 8, baixa: 48, media: 24, média: 24, alta: 8 };
const normalizePriority = (p: any): string => (p ? String(p).toLowerCase() : 'medium');
const toDate = (v: any): Date => (v instanceof Date ? v : new Date(v));
const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export default function SlaTodayTickets() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const all = await apiGet('/api/chamados');
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
            return {
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
            } as Ticket;
          });
          setTickets(mapped);
        } else {
          setTickets([]);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const today = new Date();
  const withDueDate = useMemo(() => tickets.map(t => {
    const created = toDate(t.createdAt);
    const pr = normalizePriority(t.priority);
    const hours = PRIORITY_SLA_HOURS[pr] ?? 24;
    const due = new Date(created.getTime() + hours * 3600 * 1000);
    return { ...t, dueDate: due } as Ticket & { dueDate: Date };
  }), [tickets]);

  const slaDueToday = useMemo(() => withDueDate.filter(t => isSameDay(t.dueDate, today) && ![TicketStatus.RESOLVED, TicketStatus.CLOSED].includes(t.status as any)), [withDueDate]);

  return (
    <div className="w-full h-full flex overflow-hidden m-0 p-0 border-0">
      <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-4 p-4 md:p-6 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm md:text-base">
            <button
              onClick={() => navigate('/technician-dashboard')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >Dashboard</button>
            <span className="text-muted-foreground/60">/</span>
            <span className="font-semibold text-foreground">SLA Hoje</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/technician-dashboard')}>Voltar</Button>
        </div>
        <Card className="flex-1 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base md:text-lg">Lista</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[70vh] overflow-auto">
            {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
            {!loading && slaDueToday.length === 0 && <div className="text-sm text-muted-foreground">Nenhum SLA vence hoje.</div>}
            {slaDueToday
              .slice()
              .sort((a, b) => (a as any).dueDate.getTime() - (b as any).dueDate.getTime())
              .map(t => (
                <button
                  key={t.id}
                  onClick={() => navigate(`/tickets/${t.id}`)}
                  className="w-full text-left rounded-lg border border-border/50 bg-card/90 px-4 py-3 hover:border-primary/50 hover:bg-card hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium text-sm md:text-base text-foreground/90 truncate flex-1">{t.title}</span>
                    <TicketStatusBadge status={t.status} />
                  </div>
                  <div className="flex items-center justify-between text-[10px] md:text-xs text-muted-foreground/70">
                    <div className="flex items-center gap-2">
                      <TicketPriorityBadge priority={t.priority as any} />
                      <span>Aberto: {toDate(t.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <span>Vence: {(t as any).dueDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
