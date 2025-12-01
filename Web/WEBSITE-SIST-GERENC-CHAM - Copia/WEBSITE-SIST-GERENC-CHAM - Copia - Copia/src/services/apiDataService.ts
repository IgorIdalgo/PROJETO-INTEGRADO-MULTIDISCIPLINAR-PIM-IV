import {
  Ticket,
  Comment,
  KnowledgeArticle,
  Notification,
  AISuggestion,
  User,
  UserRole,
} from '../types';
import api from '@/lib/api';

// Mapear chamado da API para o tipo Ticket
const mapTicket = (t: any): Ticket => ({
  id: t.id || t.idChamado || t.IdChamado || t.id_chamado || t.chamadoId,
  title: t.titulo || t.title || '',
  description: t.descricao || t.description || '',
  // Datas: aceitar múltiplos formatos/nomes
  createdAt: toDate(
    t.dataCriacao || t.DataCriacao || t.createdAt || t.CreatedAt || t.data_abertura || t.dataAbertura
  ),
  updatedAt: toDate(
    t.dataAtualizacao || t.DataAtualizacao || t.updatedAt || t.UpdatedAt || t.data_atualizacao
  ),
  closedAt: toDate(t.dataFechamento || t.DataFechamento || t.closedAt || t.ClosedAt),
  status: mapStatus(t.status || t.statusChamado),
  priority: mapPriority(t.prioridade || t.priority),
  category: t.categoria || t.category || 'hardware',
  requesterId: t.usuarioId || t.requesterId || '',
  requesterName: t.usuarioNome || t.requesterName || '',
  assigneeId: t.tecnicoId || t.assigneeId,
  assigneeName: t.tecnicoNome || t.assigneeName,
  attachments: t.anexos || t.attachments,
  comments: t.comentarios || t.comments,
});

// Converte diferentes formatos para Date, com fallback seguro
const toDate = (val: any): Date => {
  if (!val) return new Date(0); // epoch para evitar "agora" em dados ausentes
  try {
    // Aceita string ISO, timestamp numérico, Date
    if (val instanceof Date) return val;
    const num = Number(val);
    if (!Number.isNaN(num) && num > 0) return new Date(num);
    return new Date(val);
  } catch {
    return new Date(0);
  }
};

const mapStatus = (status: any): any => {
  if (!status) return 'open';
  const s = status.toString().toLowerCase();
  if (s.includes('aberto') || s.includes('open')) return 'open';
  if (s.includes('progresso') || s.includes('progress')) return 'in-progress';
  if (s.includes('resolvido') || s.includes('resolved')) return 'resolved';
  if (s.includes('fechado') || s.includes('closed')) return 'closed';
  return 'open';
};

const mapPriority = (priority: any): any => {
  if (!priority) return 'medium';
  const p = priority.toString().toLowerCase();
  if (p.includes('baixa') || p.includes('low')) return 'low';
  if (p.includes('media') || p.includes('medium')) return 'medium';
  if (p.includes('alta') || p.includes('high')) return 'high';
  return 'medium';
};

// Tickets - usar endpoint /api/chamados/meus que retorna os chamados do usuário logado
export const getTickets = async (): Promise<Ticket[]> => {
  try {
    console.log('=== CHAMADOS apiDataService ===');
    const res = await api.get('/api/chamados/meus');
    console.log('Resposta da API /api/chamados/meus:', res);
    const tickets = Array.isArray(res) ? res.map(mapTicket) : [];
    console.log('Tickets mapeados:', tickets);
    return tickets;
  } catch (err) {
    console.error('Erro ao buscar chamados:', err);
    throw err;
  }
};

export const getTicketById = async (id: string): Promise<Ticket | undefined> => {
  try {
    const res = await api.get(`/api/chamados/${id}`);
    return res ? mapTicket(res) : undefined;
  } catch (err) {
    console.error('Erro ao buscar chamado:', err);
    return undefined;
  }
};

export const createTicket = async (ticketData: any): Promise<Ticket> => {
  try {
    // API espera: { titulo, descricao, prioridade, categoria }
    const payload = {
      titulo: ticketData.title || ticketData.titulo,
      descricao: ticketData.description || ticketData.descricao,
      prioridade: mapPriorityToApi(ticketData.priority),
      categoria: ticketData.category || ticketData.categoria || 'Geral',
    };
    
    const res = await api.post('/api/chamados', payload);
    return mapTicket(res);
  } catch (err) {
    console.error('Erro ao criar chamado:', err);
    throw err;
  }
};

const mapPriorityToApi = (priority: any): string => {
  if (!priority) return 'Media';
  const p = priority.toString().toLowerCase();
  if (p.includes('low') || p.includes('baixa')) return 'Baixa';
  if (p.includes('medium') || p.includes('media')) return 'Media';
  if (p.includes('high') || p.includes('alta')) return 'Alta';
  return 'Media';
};

export const updateTicket = async (id: string, ticketData: Partial<Ticket>): Promise<Ticket | undefined> => {
  try {
    const payload: any = {};
    if (ticketData.title) payload.titulo = ticketData.title;
    if (ticketData.description) payload.descricao = ticketData.description;
    if (ticketData.status) payload.status = ticketData.status;
    if (ticketData.priority) payload.prioridade = mapPriorityToApi(ticketData.priority);
    if (ticketData.category) payload.categoria = ticketData.category;
    
    await api.put(`/api/chamados/${id}`, payload);
    return await getTicketById(id);
  } catch (err) {
    console.error('Erro ao atualizar chamado:', err);
    return undefined;
  }
};

export const deleteTicket = async (id: string): Promise<boolean> => {
  try {
    await api.delete(`/api/chamados/${id}`);
    return true;
  } catch (err) {
    console.error('Erro ao deletar chamado:', err);
    return false;
  }
};

// Users - endpoints não disponíveis na API do Azure, throw para fallback
const mapUserRole = (val: any): UserRole => {
  if (val === null || val === undefined) return UserRole.COLLABORATOR;
  const num = typeof val === 'number' ? val : parseInt(val, 10);
  if (!Number.isNaN(num)) {
    if (num === 1) return UserRole.ADMINISTRATOR;
    if (num === 2) return UserRole.TECHNICIAN;
    if (num === 3) return UserRole.COLLABORATOR;
  }
  const s = val?.toString().toLowerCase() || '';
  if (s.includes('admin')) return UserRole.ADMINISTRATOR;
  if (s.includes('tec') || s.includes('tech')) return UserRole.TECHNICIAN;
  return UserRole.COLLABORATOR;
};

const mapUser = (u: any): User => ({
  id: u.id || u.usuarioId,
  name: u.nome || u.name || '',
  email: u.email || u.login || '',
  role: mapUserRole(u.IdPerfil ?? u.id_perfil ?? u.idPerfil ?? u.nivelAcesso ?? u.role),
  department: u.departamento || u.department,
  avatarUrl: u.avatarUrl,
});

export const getUsers = async (): Promise<User[]> => {
  throw new Error('Not implemented on backend - users endpoint not available');
};

export const getUserById = async (id: string): Promise<User | undefined> => {
  throw new Error('Not implemented on backend');
};

export const createUser = async (userData: any): Promise<User> => {
  throw new Error('Not implemented on backend');
};

export const updateUser = async (id: string, userData: any): Promise<boolean> => {
  throw new Error('Not implemented on backend');
};

export const deleteUser = async (id: string): Promise<boolean> => {
  throw new Error('Not implemented on backend');
};

// Comments, Knowledge Base, Notifications, AI - não implementados
export const getTicketComments = async (ticketId: string): Promise<Comment[]> => {
  throw new Error('Not implemented on backend');
};

export const addComment = async (commentData: any): Promise<Comment> => {
  throw new Error('Not implemented on backend');
};

export const getKnowledgeArticles = async (): Promise<KnowledgeArticle[]> => {
  throw new Error('Not implemented on backend');
};

export const getKnowledgeArticleById = async (id: string): Promise<KnowledgeArticle | undefined> => {
  throw new Error('Not implemented on backend');
};

export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
  throw new Error('Not implemented on backend');
};

export const markNotificationAsRead = async (id: string): Promise<Notification | undefined> => {
  throw new Error('Not implemented on backend');
};

export const getAISuggestions = async (query: string): Promise<AISuggestion[]> => {
  throw new Error('Not implemented on backend');
};

export default {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
