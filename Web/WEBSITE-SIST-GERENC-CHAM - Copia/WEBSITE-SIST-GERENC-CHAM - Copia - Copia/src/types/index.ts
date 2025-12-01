
// User roles
export enum UserRole {
  COLLABORATOR = "collaborator",
  TECHNICIAN = "technician",
  ADMINISTRATOR = "administrator"
}

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatarUrl?: string;
}

// Ticket status
export enum TicketStatus {
  OPEN = "open",
  IN_ANALYSIS = "in_analysis",
  WAITING_INFO = "waiting_info",
  IN_PROGRESS = "in_progress",
  RESOLVED = "resolved",
  CLOSED = "closed"
}

// Ticket priority
export enum TicketPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical"
}

// Ticket category
export enum TicketCategory {
  HARDWARE = "hardware",
  SOFTWARE = "software",
  NETWORK = "network",
  PRINTER = "printer"
}

// Ticket interface
export interface Ticket {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  requesterId: string;
  requesterName: string;
  assigneeId?: string;
  assigneeName?: string;
  attachments?: Attachment[];
  comments?: Comment[];
  iaSuggestion?: string; // Sugestão da IA para técnicos
  aiSuggestionSent?: string; // Sugestões enviadas ao colaborador
}

// Comment interface
export interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  ticketId: string;
  isPublic: boolean;
}

// Attachment interface
export interface Attachment {
  id: string;
  name: string;
  url: string;
  ticketId: string;
  uploadedAt: Date;
  uploadedById: string;
}

// Knowledge base article
export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  authorName: string;
  category: TicketCategory;
  tags: string[];
}

// AI suggestion from knowledge base
export interface AISuggestion {
  id: string;
  title: string;
  summary: string;
  confidence: number;
  articleId: string;
  articleUrl: string;
}

// Notification
export interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
  userId: string;
  ticketId?: string;
  type: "new_ticket" | "assigned" | "comment" | "status_change" | "resolution" | "system";
}
