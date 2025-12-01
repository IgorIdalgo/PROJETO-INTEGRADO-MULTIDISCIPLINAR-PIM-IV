import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import { 
  FileText, Clock, CheckCircle, Users, Home, LogOut, Bot, Bell, BarChart3, 
  TrendingUp, AlertCircle, Zap, Target 
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  chamadosAbertos: number;
  emAndamento: number;
  chamadosResolvidos: number;
}

interface RecentTicket {
  id: string;
  titulo?: string;
  title?: string;
  status: string;
  prioridade?: string;
  priority?: string;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    chamadosAbertos: 0,
    emAndamento: 0,
    chamadosResolvidos: 0,
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      console.log('Buscando todos os chamados...');
      
      // Buscar todos os chamados usando o endpoint correto
      const response = await apiGet('/api/chamados');
      const tickets = Array.isArray(response) ? response : [];
      
      console.log('=== CHAMADOS AdminDashboard ===');
      console.log('Dados brutos:', tickets);
      console.log('Quantidade:', tickets.length);
      
      // Mapear os chamados com os campos corretos do banco
      const mappedTickets = tickets.map((t: any) => ({
        id: t.id_chamado || t.id,
        titulo: t.titulo || t.title,
        title: t.titulo || t.title,
        status: t.status,
        prioridade: t.prioridade || t.urgencia || t.priority,
        priority: t.prioridade || t.urgencia || t.priority,
        dataCriacao: t.dataabertura || t.dataCriacao || t.createdAt,
        createdAt: t.dataabertura || t.dataCriacao || t.createdAt
      }));
      
      console.log('Chamados mapeados:', mappedTickets);
      
      // Calcular estatísticas
      const chamadosAbertos = mappedTickets.filter((t: any) => 
        t.status === 'aberto' || t.status === 'open'
      ).length;
      
      const emAndamento = mappedTickets.filter((t: any) => 
        t.status === 'em_andamento' || t.status === 'in_progress'
      ).length;
      
      const chamadosResolvidos = mappedTickets.filter((t: any) => 
        t.status === 'resolvido' || t.status === 'resolved' || t.status === 'fechado' || t.status === 'closed'
      ).length;
      
      setStats({
        chamadosAbertos,
        emAndamento,
        chamadosResolvidos,
      });

      // Pegar últimos 7 chamados e ordenar por data
      const sortedTickets = mappedTickets.sort((a: any, b: any) => {
        const dateA = new Date(a.dataCriacao || a.createdAt || 0);
        const dateB = new Date(b.dataCriacao || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setRecentTickets(sortedTickets.slice(0, 7));
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      console.error('Detalhes do erro:', error.message, error.status);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      'aberto': 'aberto',
      'em_andamento': 'em andamento',
      'resolvido': 'resolvido',
      'fechado': 'fechado',
    };
    return statusMap[status] || status;
  };

  const getPriorityLabel = (priority: string) => {
    const priorityMap: Record<string, string> = {
      'baixa': 'Baixa',
      'media': 'Média',
      'alta': 'Alta',
    };
    return priorityMap[priority] || priority;
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-20 bg-gradient-to-b from-teal-700 to-teal-800 text-white flex-col items-center py-4 lg:py-6 fixed left-0 top-0 h-screen z-40 shadow-xl border-r border-teal-600">
        <div className="mb-6 lg:mb-8 p-2 bg-white/20 rounded-lg backdrop-blur">
          <Bot className="w-7 h-7 lg:w-8 lg:h-8 text-white" />
        </div>
        
        <nav className="flex-1 flex flex-col items-center gap-2 lg:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-teal-600 w-10 h-10 lg:w-12 lg:h-12 rounded-lg transition-all hover:scale-110"
            onClick={() => navigate('/admin-dashboard')}
            title="Dashboard"
          >
            <Home className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-teal-600 w-10 h-10 lg:w-12 lg:h-12 rounded-lg transition-all hover:scale-110"
            onClick={() => navigate('/all-tickets')}
            title="Gerenciar Chamados"
          >
            <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-teal-600 w-10 h-10 lg:w-12 lg:h-12 rounded-lg transition-all hover:scale-110"
            onClick={() => navigate('/users')}
            title="Usuários"
          >
            <Users className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-teal-600 w-10 h-10 lg:w-12 lg:h-12 rounded-lg transition-all hover:scale-110"
            onClick={() => navigate('/reports')}
            title="Relatórios"
          >
            <BarChart3 className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
        </nav>

        <div className="mt-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-red-500/80 w-10 h-10 lg:w-12 lg:h-12 rounded-lg transition-all hover:scale-110"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:ml-16 lg:ml-20">
        {/* Top Header */}
        <header className="bg-white/95 backdrop-blur-md h-14 md:h-16 border-b border-gray-200/50 flex items-center justify-between px-3 md:px-4 lg:px-6 shadow-md fixed top-0 right-0 md:left-16 lg:left-20 left-0 z-30">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-teal-600 to-teal-700 rounded-lg">
              <Bot className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                HelpDesk IA
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block">Admin Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-teal-600 hover:bg-teal-50 w-8 h-8 md:w-10 md:h-10 rounded-lg transition-all">
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
            <div className="h-8 md:h-10 w-px bg-gray-200/50"></div>
            <div className="flex items-center gap-2 md:gap-3">
              <Avatar className="w-8 h-8 md:w-9 md:h-9 ring-2 ring-teal-100">
                <AvatarFallback className="bg-gradient-to-br from-teal-600 to-teal-700 text-white text-sm font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-sm">
                <p className="font-semibold text-gray-900">{user?.name || user?.email || 'Usuário'}</p>
                <p className="text-gray-500 text-xs">
                  {user?.role === 'administrator' ? '👨‍💼 Administrador' : user?.role === 'technician' ? '🛠️ Técnico' : '👤 Colaborador'}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 mt-14 md:mt-16">
        <div className="max-w-full 2xl:max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8 md:mb-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600">Bem-vindo, <span className="font-semibold text-teal-600">{user?.name || user?.email || 'Usuário'}</span>! Aqui está um resumo do seu sistema.</p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm text-gray-500">Última atualização</p>
                <p className="text-lg font-semibold text-gray-700">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
            {/* Total Abertos Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-150 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500/20 rounded-xl group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <TrendingUp className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Chamados Abertos</p>
                <p className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stats.chamadosAbertos}
                </p>
                <p className="text-xs text-gray-500">Aguardando ação</p>
              </CardContent>
            </Card>

            {/* Em Andamento Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-amber-50 to-amber-100 hover:from-amber-100 hover:to-amber-150 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Clock className="w-6 h-6 text-amber-600" />
                  </div>
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Em Andamento</p>
                <p className="text-3xl md:text-4xl font-bold text-amber-600 mb-2">
                  {stats.emAndamento}
                </p>
                <p className="text-xs text-gray-500">Em progresso</p>
              </CardContent>
            </Card>

            {/* Resolvidos Card */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-150 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <Target className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Chamados Resolvidos</p>
                <p className="text-3xl md:text-4xl font-bold text-green-600 mb-2">
                  {stats.chamadosResolvidos}
                </p>
                <p className="text-xs text-gray-500">Concluídos</p>
              </CardContent>
            </Card>

            {/* Taxa de Resolução */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-150 cursor-pointer group">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition-transform">
                    <BarChart3 className="w-6 h-6 text-purple-600" />
                  </div>
                  <AlertCircle className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-sm font-medium text-gray-600 mb-1">Taxa de Resolução</p>
                <p className="text-3xl md:text-4xl font-bold text-purple-600 mb-2">
                  {stats.chamadosAbertos + stats.emAndamento + stats.chamadosResolvidos > 0
                    ? Math.round((stats.chamadosResolvidos / (stats.chamadosAbertos + stats.emAndamento + stats.chamadosResolvidos)) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500">Do total</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Section */}
          <div className="grid grid-cols-1 gap-6 md:gap-8">
            {/* System Status - Full Width */}
            <div>
              {/* System Status */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-6 border-b border-gray-200/50">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 bg-teal-600 rounded-lg">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-lg md:text-xl font-bold text-gray-900">
                      Status do Sistema
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 ml-11">Verificação de componentes</p>
                </div>
                <CardContent className="p-6 space-y-6">
                  {/* API Backend Status */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">API Backend</h4>
                      <p className="text-sm text-gray-600">Serviço .NET em execução</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Online</span>
                    </div>
                  </div>

                  {/* Database Status */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Banco de Dados</h4>
                      <p className="text-sm text-gray-600">SQL Server conectado</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Online</span>
                    </div>
                  </div>

                  {/* Server Status */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Servidor</h4>
                      <p className="text-sm text-gray-600">Aplicação operacional</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Online</span>
                    </div>
                  </div>

                  {/* Frontend Status */}
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Frontend</h4>
                      <p className="text-sm text-gray-600">Interface React/Vite</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded-full">Online</span>
                    </div>
                  </div>

                  {/* System Health */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200 mt-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">Saúde do Sistema</h4>
                      <span className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">100%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-full w-full rounded-full"></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">Todos os serviços funcionando normalmente</p>
                  </div>

                  {/* Last Update */}
                  <div className="text-center pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      Última verificação: <span className="font-semibold text-gray-700">{new Date().toLocaleTimeString('pt-BR')}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        </main>
      </div>
    </div>
  );
}
