import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiGet } from "@/lib/api";
import { UserRole, Ticket, TicketStatus } from "@/types";
import { FileText, TrendingUp, TrendingDown, CheckCircle, Clock, AlertCircle, Download, Calendar } from "lucide-react";

interface ReportData {
  periodo: string;
  totalAbertos: number;
  totalFechados: number;
  totalEmAndamento: number;
  totalResolvidos: number;
  percentualFechamento: number;
  tempoMedioResolucao: number;
  porPrioridade: {
    baixa: number;
    media: number;
    alta: number;
  };
  porCategoria: {
    hardware: number;
    software: number;
    network: number;
    printer: number;
  };
}

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("15"); // 15 dias por padrão
  const [reportData, setReportData] = useState<ReportData | null>(null);

  // Verificar se é administrador
  if (user?.role !== UserRole.ADMINISTRATOR) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground mb-4">
          Apenas administradores têm acesso aos relatórios.
        </p>
        <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
      </div>
    );
  }

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (tickets.length > 0) {
      generateReport();
    }
  }, [tickets, selectedPeriod]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await apiGet('/api/chamados');
      const rawList = Array.isArray(response) ? response : [];
      // Normalizar para o tipo Ticket utilizado no frontend
      const normalized: Ticket[] = rawList.map((t: any) => ({
        id: String(t.id_chamado || t.id),
        title: t.titulo || t.title || 'Sem título',
        description: t.descricao || t.description || '',
        status: (t.status as TicketStatus) || TicketStatus.OPEN,
        priority: (t.prioridade || t.priority || 'Média') as any,
        category: (t.categoria || t.category || 'hardware') as any,
        createdAt: t.dataabertura || t.dataCriacao || t.createdAt || new Date(),
        updatedAt: t.dataatualizacao || t.dataAtualizacao || t.updatedAt || new Date(),
        requesterId: t.id_cliente || t.usuarioId || '',
        requesterName: t.nome_cliente || t.nomeUsuario || t.requesterName || 'Usuário',
        assigneeId: t.id_tecnico || t.tecnicoId,
        assigneeName: t.nome_tecnico || t.nomeTecnico || t.assigneeName,
      }));
      setTickets(normalized);
    } catch (error) {
      console.error("Erro ao carregar chamados:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateReport = () => {
    const days = parseInt(selectedPeriod);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Filtrar tickets do período
    const periodTickets = tickets.filter(ticket => {
      const ticketDate = new Date(ticket.createdAt);
      return ticketDate >= cutoffDate;
    });

    // Calcular métricas
    const totalAbertos = periodTickets.filter(t => t.status === TicketStatus.OPEN).length;

    const totalFechados = periodTickets.filter(t => t.status === TicketStatus.CLOSED).length;

    const totalEmAndamento = periodTickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length;

    const totalResolvidos = periodTickets.filter(t => t.status === TicketStatus.RESOLVED).length;

    const percentualFechamento = periodTickets.length > 0
      ? ((totalFechados / periodTickets.length) * 100).toFixed(1)
      : 0;

    // Calcular tempo médio de resolução (em horas)
    const resolvedTickets = periodTickets.filter(t => 
      t.status === TicketStatus.RESOLVED || t.status === TicketStatus.CLOSED
    );
    
    let tempoMedioResolucao = 0;
    if (resolvedTickets.length > 0) {
      const temposResolucao = resolvedTickets
        .filter(t => t.createdAt)
        .map(t => {
          const dataAbertura = new Date(t.createdAt);
          const agora = new Date();
          const diferencaHoras = Math.abs(agora.getTime() - dataAbertura.getTime()) / (1000 * 60 * 60);
          return diferencaHoras;
        });
      
      if (temposResolucao.length > 0) {
        tempoMedioResolucao = Math.round(
          temposResolucao.reduce((acc, val) => acc + val, 0) / temposResolucao.length
        );
      }
    }

    // Agrupar por prioridade
    const prio = String;
    const porPrioridade = {
      baixa: periodTickets.filter(t => String(t.priority).toLowerCase() === 'baixa' || String(t.priority).toLowerCase() === 'low').length,
      media: periodTickets.filter(t => String(t.priority).toLowerCase() === 'média' || String(t.priority).toLowerCase() === 'media' || String(t.priority).toLowerCase() === 'medium').length,
      alta: periodTickets.filter(t => String(t.priority).toLowerCase() === 'alta' || String(t.priority).toLowerCase() === 'high').length,
    };

    // Agrupar por categoria
    const porCategoria = {
      hardware: periodTickets.filter(t => String(t.category).toLowerCase() === 'hardware').length,
      software: periodTickets.filter(t => String(t.category).toLowerCase() === 'software').length,
      network: periodTickets.filter(t => String(t.category).toLowerCase() === 'network' || String(t.category).toLowerCase() === 'rede').length,
      printer: periodTickets.filter(t => String(t.category).toLowerCase() === 'printer' || String(t.category).toLowerCase() === 'impressora').length,
    };

    setReportData({
      periodo: `Últimos ${days} dias`,
      totalAbertos,
      totalFechados,
      totalEmAndamento,
      totalResolvidos,
      percentualFechamento: Number(percentualFechamento),
      tempoMedioResolucao,
      porPrioridade,
      porCategoria,
    });
  };

  const exportReport = () => {
    if (!reportData) return;

    const reportText = `
RELATÓRIO DE CHAMADOS - ${reportData.periodo}
${new Date().toLocaleDateString('pt-BR')}
=====================================

RESUMO GERAL:
- Total de Chamados Abertos: ${reportData.totalAbertos}
- Total de Chamados Fechados: ${reportData.totalFechados}
- Total em Andamento: ${reportData.totalEmAndamento}
- Total Resolvidos: ${reportData.totalResolvidos}
- Percentual de Fechamento: ${reportData.percentualFechamento}%
- Tempo Médio de Resolução: ${reportData.tempoMedioResolucao}h

POR PRIORIDADE:
- Baixa: ${reportData.porPrioridade.baixa}
- Média: ${reportData.porPrioridade.media}
- Alta: ${reportData.porPrioridade.alta}

POR CATEGORIA:
- Hardware: ${reportData.porCategoria.hardware}
- Software: ${reportData.porCategoria.software}
- Rede: ${reportData.porCategoria.network}
- Impressora: ${reportData.porCategoria.printer}
    `.trim();

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-chamados-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 w-full max-w-screen-xl mx-auto px-3 md:px-4 lg:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Relatórios</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Análise de desempenho e estatísticas de chamados
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[160px] md:w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="15">Últimos 15 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" className="w-full sm:w-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {reportData && (
        <>
          {/* ===== GRID: MÉTRICAS PRINCIPAIS (Abertos, Fechados, Taxa, Tempo) ===== */}
          <div className="grid gap-4 lg:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr w-full">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Chamados Abertos
                </CardTitle>
                <FileText className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold">{reportData.totalAbertos}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.periodo}
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Chamados Fechados
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold">{reportData.totalFechados}</div>
                <p className="text-xs text-muted-foreground">
                  {reportData.periodo}
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Taxa de Fechamento
                </CardTitle>
                {reportData.percentualFechamento >= 70 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold">{reportData.percentualFechamento}%</div>
                <p className="text-xs text-muted-foreground">
                  Meta: 80%
                </p>
              </CardContent>
            </Card>

            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Tempo Médio
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl lg:text-4xl font-bold">{reportData.tempoMedioResolucao}h</div>
                <p className="text-xs text-muted-foreground">
                  Resolução média
                </p>
              </CardContent>
            </Card>
          </div>

          {/* ===== GRID: STATUS / PRIORIDADE / CATEGORIA ===== */}
          <div className="grid gap-4 lg:gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr w-full">
            <Card className="md:col-span-1 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Status dos Chamados</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm font-medium">Em Aberto</span>
                  </div>
                  <span className="text-2xl lg:text-3xl font-bold">{reportData.totalAbertos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm font-medium">Em Andamento</span>
                  </div>
                  <span className="text-2xl lg:text-3xl font-bold">{reportData.totalEmAndamento}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-sm font-medium">Resolvidos</span>
                  </div>
                  <span className="text-2xl lg:text-3xl font-bold">{reportData.totalResolvidos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                    <span className="text-sm font-medium">Fechados</span>
                  </div>
                  <span className="text-2xl lg:text-3xl font-bold">{reportData.totalFechados}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-1 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Distribuição por Prioridade</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Alta</span>
                  </div>
                  <span className="text-2xl lg:text-3xl font-bold">{reportData.porPrioridade.alta}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Média</span>
                  </div>
                  <span className="text-2xl lg:text-3xl font-bold">{reportData.porPrioridade.media}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Baixa</span>
                  </div>
                  <span className="text-2xl lg:text-3xl font-bold">{reportData.porPrioridade.baixa}</span>
                </div>
              </CardContent>
            </Card>

            {/* Distribuição por Categoria na direita */}
            <Card className="md:col-span-1 h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Distribuição por Categoria</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-5">
                  <div className="text-center p-3 md:p-4 border rounded-lg">
                    <div className="text-3xl md:text-4xl font-bold text-blue-600">{reportData.porCategoria.hardware}</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">Hardware</div>
                  </div>
                  <div className="text-center p-3 md:p-4 border rounded-lg">
                    <div className="text-3xl md:text-4xl font-bold text-purple-600">{reportData.porCategoria.software}</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">Software</div>
                  </div>
                  <div className="text-center p-3 md:p-4 border rounded-lg">
                    <div className="text-3xl md:text-4xl font-bold text-green-600">{reportData.porCategoria.network}</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">Rede</div>
                  </div>
                  <div className="text-center p-3 md:p-4 border rounded-lg">
                    <div className="text-3xl md:text-4xl font-bold text-orange-600">{reportData.porCategoria.printer}</div>
                    <div className="text-xs md:text-sm text-muted-foreground mt-1">Impressora</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
