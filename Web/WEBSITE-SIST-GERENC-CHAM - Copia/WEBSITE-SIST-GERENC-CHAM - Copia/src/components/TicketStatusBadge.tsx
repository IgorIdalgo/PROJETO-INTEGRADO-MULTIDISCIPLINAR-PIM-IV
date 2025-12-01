
import { Badge } from "@/components/ui/badge";
import { TicketStatus } from "@/types";

type StatusConfig = {
  label: string;
  variant: "default" | "destructive" | "outline" | "secondary" | "success";
};

const statusConfigs: Record<TicketStatus, StatusConfig> = {
  open: {
    label: "Aberto",
    variant: "default"
  },
  in_analysis: {
    label: "Em Análise",
    variant: "secondary"
  },
  waiting_info: {
    label: "Aguardando Informação",
    variant: "outline"
  },
  in_progress: {
    label: "Em Andamento",
    variant: "secondary"
  },
  resolved: {
    label: "Resolvido",
    variant: "success"
  },
  closed: {
    label: "Fechado",
    variant: "outline"
  }
};

// Mapa para converter labels em português para chaves do enum
const portugueseToEnumMap: Record<string, TicketStatus> = {
  "Aberto": "open",
  "Em Análise": "in_analysis",
  "Aguardando Informação": "waiting_info",
  "Em Andamento": "in_progress",
  "Resolvido": "resolved",
  "Fechado": "closed",
  "open": "open",
  "in_analysis": "in_analysis",
  "waiting_info": "waiting_info",
  "in_progress": "in_progress",
  "resolved": "resolved",
  "closed": "closed",
};

interface TicketStatusBadgeProps {
  status: TicketStatus | string;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  // Convert Portuguese labels to enum keys if needed
  const enumStatus = (portugueseToEnumMap[status as string] || status) as TicketStatus;
  
  // Make sure status is valid and exists in our configs
  const config = statusConfigs[enumStatus] || statusConfigs.open;
  
  return (
    <Badge variant={config.variant as "default" | "destructive" | "outline" | "secondary"}>{config.label}</Badge>
  );
}
