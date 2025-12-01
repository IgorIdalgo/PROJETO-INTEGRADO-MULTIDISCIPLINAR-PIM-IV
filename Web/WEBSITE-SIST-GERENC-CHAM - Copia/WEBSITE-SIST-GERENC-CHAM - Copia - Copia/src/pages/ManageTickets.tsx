import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiGet, apiPut, apiPost } from '@/lib/api';
import { Ticket, TicketStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TicketStatusBadge } from '@/components/TicketStatusBadge';
import { TicketPriorityBadge } from '@/components/TicketPriorityBadge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Clock, AlertTriangle, MessageSquare, Edit2, RotateCcw } from 'lucide-react';

const toDate = (v: any): Date => (v instanceof Date ? v : new Date(v));

interface Technician { id: string; name: string; }
interface Comment { id: string; conteudo: string; nomeAutor: string; createdAt: string; }

const PRIORITY_SLA_HOURS: Record<string, number> = { low: 48, medium: 24, high: 8, baixa: 48, media: 24, média: 24, alta: 8, '1': 8, '2': 8, '3': 24, '4': 48, '5': 48 };

export default function ManageTickets() {
  const { user, isTechnician, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [currentTicketForComment, setCurrentTicketForComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Record<string, Comment[]>>({});
  // Aba ativa: 'abertos' | 'andamento' | 'resolvidos' | 'fechados'
  const [activeTab, setActiveTab] = useState<'abertos' | 'andamento' | 'resolvidos' | 'fechados'>('abertos');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      let all: any[] = [];
      try {
        all = await apiGet('/api/chamados/todos');
      } catch (e: any) {
        if (e?.status === 404) {
          // Fallback para Azure: /api/chamados
          all = await apiGet('/api/chamados');
        } else {
          throw e;
        }
      }
      let users: any[] = [];
      try {
        users = await apiGet('/api/usuarios');
      } catch (e) {
        users = [];
      }
      const techs = Array.isArray(users)
        ? users.filter((u: any) => {
            const role = u.role ?? u.nivelAcesso ?? u.IdPerfil ?? u.id_perfil;
            const r = String(role).toLowerCase();
            return r.includes('tech') || role === 2 || r.includes('técnico');
          }).map((u: any) => ({ 
            id: String(u.id ?? u.IdUsuario ?? u.usuarioId ?? u.idUsuario ?? ''), 
            name: u.nome ?? u.nomeUsuario ?? u.name ?? 'Técnico' 
          }))
        : [];
      setTechnicians(techs);

      if (Array.isArray(all)) {
        const mapped = all.map((ticket: any, idx: number) => {
          const guidCandidate = ticket.id ?? ticket.Id ?? ticket.ID;
          const numericCandidate = ticket.idChamado ?? ticket.id_chamado ?? ticket.IdChamado ?? ticket.Id_chamado;
          const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
          const finalId = guidCandidate && guidRegex.test(String(guidCandidate))
            ? String(guidCandidate)
            : (numericCandidate !== undefined && numericCandidate !== null && numericCandidate !== ''
                ? String(numericCandidate)
                : (ticket.id ? String(ticket.id) : `temp-${idx}`));
          const created = ticket.dataAbertura ?? ticket.dataabertura ?? ticket.dataCriacao ?? ticket.createdAt ?? new Date();
          const prioridade = ticket.prioridade ?? ticket.urgencia ?? ticket.priority ?? 3;
          const categoria = ticket.categoria ?? ticket.category ?? ticket.idCategoria ?? 'hardware';
          const assigneeId = ticket.tecnicoId ?? ticket.id_tecnico ?? ticket.idTecnico ?? ticket.tecnicoId ?? '';
          return {
            id: finalId,
            title: ticket.titulo || ticket.title || 'Sem título',
            description: ticket.descricao || ticket.description || '',
            status: ticket.status || 'Aberto',
            priority: prioridade,
            category: String(categoria).toLowerCase(),
            createdAt: created,
            updatedAt: ticket.dataAtualizacao ?? ticket.updatedAt ?? created,
            requesterId: ticket.usuarioId ?? ticket.id_cliente ?? ticket.idCliente ?? '',
            requesterName: ticket.nome_cliente ?? ticket.nomeCliente ?? ticket.requesterName ?? 'Usuário',
            assigneeId: String(assigneeId),
            assigneeName: techs.find(t => t.id === String(assigneeId))?.name ?? (assigneeId ? 'Técnico' : 'Não atribuído'),
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

  useEffect(() => { fetchTickets(); }, []);

  const getSlaInfo = (ticket: Ticket) => {
    const created = toDate(ticket.createdAt);
    const pr = String(ticket.priority).toLowerCase();
    const hours = PRIORITY_SLA_HOURS[pr] ?? PRIORITY_SLA_HOURS[String(ticket.priority)] ?? 24;
    const due = new Date(created.getTime() + hours * 3600 * 1000);
    const now = new Date();
    const remaining = due.getTime() - now.getTime();
    const isOverdue = remaining < 0;
    const hoursRemaining = Math.abs(Math.floor(remaining / 3600000));
    return { due, isOverdue, hoursRemaining };
  };

  const openTickets = useMemo(() => tickets.filter(t => t.status === 'Aberto' || t.status === TicketStatus.OPEN), [tickets]);
  const inProgressTickets = useMemo(() => tickets.filter(t => t.status === 'EmAtendimento' || t.status === 'Em Andamento' || t.status === TicketStatus.IN_PROGRESS), [tickets]);
  const resolvedTickets = useMemo(() => tickets.filter(t => t.status === 'Resolvido'), [tickets]);
  const closedTickets = useMemo(() => tickets.filter(t => t.status === 'Fechado' || t.status === TicketStatus.CLOSED), [tickets]);

  const getVisibleTickets = () => {
    switch (activeTab) {
      case 'abertos': return openTickets;
      case 'andamento': return inProgressTickets;
      case 'resolvidos': return resolvedTickets;
      case 'fechados': return closedTickets;
      default: return openTickets;
    }
  };

  const assignTicket = async (ticketId: string, technicianId: string) => {
    try {
      // Validar GUID antes de enviar
      const isGuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(ticketId);
      if (!isGuid) {
        toast.error('Este chamado não possui GUID válido para atribuição pela API Azure. Abra os detalhes do chamado para obter o GUID correto.');
        return;
      }
      await apiPost(`/api/chamados/${ticketId}/atribuir`, { tecnicoId: technicianId });
      toast.success('Técnico atribuído com sucesso');
      setTickets(prev => prev.map(t => t.id === ticketId ? { 
        ...t, 
        assigneeId: technicianId, 
        assigneeName: technicians.find(x => x.id === technicianId)?.name ?? 'Técnico' 
      } : t));
      // Atualiza visualização se mudar status em outra aba
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao atribuir técnico');
    }
  };

  const updateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const current = tickets.find(t => t.id === ticketId);
      if (!current) return;
      const guidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
      if (!guidRegex.test(current.id)) {
        toast.error('Não foi possível atualizar: este chamado não possui GUID válido na API Azure. Abra os detalhes para operar com o GUID.');
        return;
      }
      
      const payload = {
        id: current.id,
        titulo: current.title,
        descricao: current.description,
        usuarioId: current.requesterId,
        status: newStatus === 'Em Andamento' ? 'EmAtendimento' : newStatus,
        prioridade: typeof current.priority === 'number' ? current.priority : 3,
        categoria: current.category,
        tecnicoId: current.assigneeId || null,
        createdAt: current.createdAt,
        updatedAt: new Date().toISOString(),
        closedAt: newStatus === 'Fechado' ? new Date().toISOString() : null
      };
      
      // Tenta PATCH minimalista primeiro (compatível com APIs que aceitam atualização parcial)
      try {
        await apiPatch(`/api/chamados/${current.id}`, { status: payload.status });
      } catch (e) {
        // Fallback para PUT completo
        await apiPut(`/api/chamados/${current.id}`, payload);
      }
      toast.success('Status atualizado');
      // Optimistic move: atualiza status local e "remove" da aba anterior
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
      // Se passou para resolvido ou fechado, muda para a aba correspondente automaticamente
      if (newStatus === 'Resolvido') setActiveTab('resolvidos');
      if (newStatus === 'Fechado') setActiveTab('fechados');
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao atualizar status');
    }
  };

  const updateTicketDetails = async () => {
    if (!editingTicket) return;
    try {
      const payload = {
        id: editingTicket.id,
        titulo: editingTicket.title,
        descricao: editingTicket.description,
        usuarioId: editingTicket.requesterId,
        status: editingTicket.status === 'Em Andamento' ? 'EmAtendimento' : editingTicket.status,
        prioridade: typeof editingTicket.priority === 'number' ? editingTicket.priority : 3,
        categoria: editingTicket.category,
        tecnicoId: editingTicket.assigneeId || null,
        createdAt: editingTicket.createdAt,
        updatedAt: new Date().toISOString()
      };
      
      await apiPut(`/api/chamados/${editingTicket.id}`, payload);
      toast.success('Detalhes atualizados');
      setTickets(prev => prev.map(t => t.id === editingTicket.id ? editingTicket : t));
      setEditingTicket(null);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao atualizar detalhes');
    }
  };

  const reopenTicket = async (ticketId: string) => {
    try {
      await apiPost(`/api/chamados/${ticketId}/reabrir`, {});
      toast.success('Chamado reaberto');
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'Aberto' } : t));
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao reabrir chamado');
    }
  };

  const loadComments = async (ticketId: string) => {
    try {
      const data = await apiGet(`/api/chamados/${ticketId}/comentarios`);
      setComments(prev => ({ ...prev, [ticketId]: Array.isArray(data) ? data : [] }));
    } catch (e) {
      toast.error('Erro ao carregar comentários');
    }
  };

  const addComment = async () => {
    if (!currentTicketForComment || !commentText.trim()) return;
    try {
      await apiPost(`/api/chamados/${currentTicketForComment}/comentarios`, {
        conteudo: commentText,
        id_Autor: user?.id,
        publico: true
      });
      toast.success('Comentário adicionado');
      setCommentText('');
      setCommentDialogOpen(false);
      loadComments(currentTicketForComment);
    } catch (e: any) {
      toast.error(e?.message ?? 'Falha ao adicionar comentário');
    }
  };

  const openCommentDialog = (ticketId: string) => {
    setCurrentTicketForComment(ticketId);
    setCommentDialogOpen(true);
    loadComments(ticketId);
  };

  if (!isTechnician && !isAdmin) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Acesso restrito</CardTitle></CardHeader>
          <CardContent>Esta página é apenas para técnicos e administradores.</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen flex overflow-hidden m-0 p-0 border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-[1500px] mx-auto flex flex-col gap-6 p-4 md:p-8 h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm md:text-base">
            <button onClick={() => navigate('/technician-dashboard')} className="text-muted-foreground hover:text-primary transition-colors">Dashboard</button>
            <span className="text-muted-foreground/60">/</span>
            <span className="font-semibold text-foreground">Gerenciar Chamados</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchTickets}>Atualizar Lista</Button>
            <Button variant="default" size="sm" onClick={() => navigate('/technician-dashboard')}>Voltar</Button>
          </div>
        </div>

        <Card className="flex-1 overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3 space-y-3">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <span>Gerenciar Chamados</span>
            </CardTitle>
            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="min-w-[120px]" variant={activeTab === 'abertos' ? 'default' : 'outline'} onClick={() => setActiveTab('abertos')}>Abertos ({openTickets.length})</Button>
              <Button size="sm" className="min-w-[120px]" variant={activeTab === 'andamento' ? 'default' : 'outline'} onClick={() => setActiveTab('andamento')}>Em Andamento ({inProgressTickets.length})</Button>
              <Button size="sm" className="min-w-[120px]" variant={activeTab === 'resolvidos' ? 'default' : 'outline'} onClick={() => setActiveTab('resolvidos')}>Resolvidos ({resolvedTickets.length})</Button>
              <Button size="sm" className="min-w-[120px]" variant={activeTab === 'fechados' ? 'default' : 'outline'} onClick={() => setActiveTab('fechados')}>Fechados ({closedTickets.length})</Button>
            </div>
            <div className="text-xs text-muted-foreground">Clique nos botões acima para filtrar os chamados por status. Ao resolver ou fechar um chamado ele migra automaticamente para a aba correspondente.</div>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[75vh] overflow-auto px-1 md:px-2">
            {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}
            {!loading && getVisibleTickets().length === 0 && <div className="text-sm text-muted-foreground">Nenhum chamado nesta aba.</div>}
            {getVisibleTickets()
              .slice()
              .sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime())
              .map(t => {
                const sla = getSlaInfo(t);
                const statusColor = t.status === 'Resolvido'
                  ? 'bg-green-50 dark:bg-green-950/40'
                  : t.status === 'Fechado'
                    ? 'bg-slate-100 dark:bg-slate-900'
                    : t.status === 'EmAtendimento' || t.status === 'Em Andamento'
                      ? 'bg-amber-50 dark:bg-amber-950/40'
                      : 'bg-white dark:bg-slate-950';
                return (
                  <div
                    key={t.id}
                    className={`rounded-xl border ${sla.isOverdue ? 'border-red-500' : 'border-slate-200 dark:border-slate-800'} ${statusColor} px-5 py-4 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-base truncate">{t.title}</span>
                          <TicketStatusBadge status={t.status} />
                          {sla.isOverdue && <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <TicketPriorityBadge priority={t.priority as any} />
                          <span>#{t.id}</span>
                          <span>Aberto: {toDate(t.createdAt).toLocaleDateString('pt-BR')}</span>
                          <span className={sla.isOverdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                            <Clock size={12} className="inline mr-1" />
                            SLA: {sla.isOverdue ? `Vencido há ${sla.hoursRemaining}h` : `${sla.hoursRemaining}h restantes`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Atribuição */}
                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                      <Label className="text-xs">Técnico:</Label>
                      <Select value={t.assigneeId || 'none'} onValueChange={(val) => val !== 'none' && assignTicket(t.id, val)}>
                        <SelectTrigger className="w-56 h-9 text-xs">
                          <SelectValue placeholder="Atribuir técnico" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64 overflow-auto">
                          <SelectItem value="none">Não atribuído</SelectItem>
                          <SelectItem value={String(user?.id)}>Atribuir a mim</SelectItem>
                          {technicians.length > 0 && technicians.filter(tec => tec.id !== String(user?.id)).map(tec => (
                            <SelectItem key={tec.id} value={tec.id}>{tec.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs text-muted-foreground">{t.assigneeName}</span>
                    </div>

                    {/* Status Flow (somente se não fechado) */}
                    {!(t.status === 'Fechado' || t.status === 'Resolvido') && (
                      <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <Label className="text-xs">Alterar status:</Label>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(t.id, 'EmAtendimento')}>Em Andamento</Button>
                        <Button size="sm" variant="default" onClick={() => updateStatus(t.id, 'Resolvido')}>Resolvido</Button>
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(t.id, 'Fechado')}>Fechar</Button>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-wrap mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="ghost" onClick={() => setEditingTicket(t)}><Edit2 size={14} className="mr-1" />Editar detalhes</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader><DialogTitle>Editar Chamado #{t.id}</DialogTitle></DialogHeader>
                          {editingTicket && editingTicket.id === t.id && (
                            <div className="space-y-3">
                              <div>
                                <Label>Prioridade</Label>
                                <Select value={String(editingTicket.priority)} onValueChange={(val) => setEditingTicket({ ...editingTicket, priority: parseInt(val) as any })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="5">Baixa</SelectItem>
                                    <SelectItem value="3">Média</SelectItem>
                                    <SelectItem value="1">Alta</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Categoria</Label>
                                <Select value={editingTicket.category} onValueChange={(val) => setEditingTicket({ ...editingTicket, category: val as any })}>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="hardware">Hardware</SelectItem>
                                    <SelectItem value="software">Software</SelectItem>
                                    <SelectItem value="rede">Rede</SelectItem>
                                    <SelectItem value="outro">Outro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button onClick={updateTicketDetails}>Salvar</Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button size="sm" variant="ghost" onClick={() => openCommentDialog(t.id)}>
                        <MessageSquare size={14} className="mr-1" />Comentários
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/tickets/${t.id}`)}>Abrir detalhes</Button>
                    </div>
                  </div>
                );
              })}
          </CardContent>
        </Card>

        {/* Comment Dialog */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
            <DialogHeader><DialogTitle>Comentários - #{currentTicketForComment}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              {currentTicketForComment && comments[currentTicketForComment]?.map(c => (
                <div key={c.id} className="border-b pb-2">
                  <div className="text-xs text-muted-foreground">{c.nomeAutor} · {new Date(c.createdAt).toLocaleString('pt-BR')}</div>
                  <div className="text-sm">{c.conteudo}</div>
                </div>
              ))}
              {currentTicketForComment && comments[currentTicketForComment]?.length === 0 && (
                <div className="text-sm text-muted-foreground">Nenhum comentário ainda.</div>
              )}
              <div className="space-y-2">
                <Label>Adicionar comentário</Label>
                <Textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Digite seu comentário..." rows={3} />
                <Button onClick={addComment} disabled={!commentText.trim()}>Enviar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Reabrir chamado - aparece na aba resolvidos/fechados acima em cada item */}
      </div>
    </div>
  );
}
