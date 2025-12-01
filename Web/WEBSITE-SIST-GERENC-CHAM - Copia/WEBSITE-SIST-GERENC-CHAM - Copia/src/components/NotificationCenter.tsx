import { useState, useEffect } from 'react';
import { API_URL, getAuthToken } from '@/lib/api';
import { Bell, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Notification } from '@/types';
import { apiGet, apiPatch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

// Mapear tipos de notificação do backend para o frontend
const mapNotificationType = (tipo: number): Notification['type'] => {
  const typeMap: Record<number, Notification['type']> = {
    0: 'comment',          // ComentarioAdicionado
    1: 'status_change',    // StatusAtualizado
    2: 'assigned',         // ChamadoAtribuido
    3: 'resolution',       // ChamadoResolvido
    4: 'system',           // ChamadoReaberto
  };
  return typeMap[tipo] || 'system';
};

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

      let stopped = false;
      const fetchNotifications = async () => {
        try {
          if (!user?.id || stopped) return;
          const url = `/api/notificacoes/usuario/${user.id}`;
          const res = await fetch(`${API_URL}${url}`, { headers: { 'Authorization': getAuthToken() ? `Bearer ${getAuthToken()}` : '' } });
          if (res.status === 404) {
            console.warn('Notificações não disponíveis na API Azure (404). Desativando componente.');
            setNotifications([]);
            setUnreadCount(0);
            stopped = true;
            return;
          }
          if (!res.ok) {
            console.warn('Falha ao buscar notificações:', res.status);
            return;
          }
          const data = await res.json();
          if (Array.isArray(data)) {
            const mapped = data.map((n: any) => ({
              id: n.id ?? n.Id ?? n.ID,
              userId: n.usuarioId ?? n.UsuarioId,
              type: mapNotificationType(n.tipo ?? n.Tipo ?? 0),
              title: n.titulo ?? n.Titulo ?? '',
              message: n.mensagem ?? n.Mensagem ?? '',
              ticketId: n.chamadoId ?? n.ChamadoId,
              isRead: Boolean(n.lida ?? n.Lida ?? false),
              createdAt: n.createdAt ?? n.CreatedAt ?? new Date().toISOString()
            }));
            setNotifications(mapped);
            setUnreadCount(mapped.filter(n => !n.isRead).length);
          }
        } catch (e: any) {
          console.error('Erro ao buscar notificações:', e?.message ?? e);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => { stopped = true; clearInterval(interval); };
  }, [user]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      try {
        await apiPatch(`/api/notificacoes/${notification.id}/marcar-lida`, {});
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Failed to mark notification as read:", error);
      }
    }

    if (notification.ticketId) {
      navigate(`/tickets/${notification.ticketId}`);
      setOpen(false);
    }
  };

  const handleDismissNotification = async (notification: Notification, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiPatch(`/api/notificacoes/${notification.id}/marcar-lida`, {});
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
      if (!notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Failed to dismiss notification:", error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    
    try {
      await apiPatch(`/api/notificacoes/usuario/${user.id}/marcar-todas-lidas`, {});
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    // Less than a minute
    if (diff < 60 * 1000) {
      return 'Agora mesmo';
    }
    
    // Less than an hour
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      return `há ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }
    
    // Less than a day
    if (diff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diff / (60 * 60 * 1000));
      return `há ${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }
    
    // Otherwise show relative days
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    if (days < 7) {
      return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
    }
    
    return date.toLocaleDateString('pt-BR');
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const unreadNotifications = notifications.filter(n => !n.isRead);
  const allNotifications = notifications;

  if (!user) return null;

  const NotificationItem = ({ notification }: { notification: Notification }) => (
    <div
      className="group relative flex gap-3 p-3 border-b last:border-b-0 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
          {notification.title ? getInitials(notification.title.split(' ')[0]) : 'DC'}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-sm leading-tight">{notification.title}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            onClick={(e) => handleDismissNotification(notification, e)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-1">{notification.message}</p>
        <span className="text-xs text-muted-foreground">
          {formatTime(notification.createdAt)}
        </span>
      </div>
    </div>
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="end">
        <Tabs defaultValue="all" className="w-full">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <h3 className="font-semibold text-base">Notificações ({unreadCount})</h3>
            <Button 
              variant="link" 
              size="sm" 
              onClick={handleMarkAllRead}
              className="text-xs h-auto p-0 text-primary"
            >
              Limpar tudo
            </Button>
          </div>
          
          <TabsList className="w-full grid grid-cols-2 px-4">
            <TabsTrigger value="all" className="text-sm">
              TODAS NOTIFICAÇÕES
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-sm">
              NÃO LIDAS
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {allNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma notificação
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                {allNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="unread" className="mt-0">
            {unreadNotifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                Nenhuma notificação não lida
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                {unreadNotifications.map((notification) => (
                  <NotificationItem key={notification.id} notification={notification} />
                ))}
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
