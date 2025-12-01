
import { TicketPriority } from "@/types";
import { Badge } from "@/components/ui/badge";

interface TicketPriorityBadgeProps {
  priority: TicketPriority | string;
}

export function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps) {
  const getPriorityConfig = () => {
    const priorityStr = String(priority).toLowerCase();
    
    // Handle Portuguese labels
    if (priorityStr === 'baixa' || priorityStr === TicketPriority.LOW.toString()) {
      return { label: 'Baixa', className: 'bg-green-100 text-green-800 hover:bg-green-100/80' };
    } else if (priorityStr === 'média' || priorityStr === 'media' || priorityStr === TicketPriority.MEDIUM.toString()) {
      return { label: 'Média', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100/80' };
    } else if (priorityStr === 'alta' || priorityStr === TicketPriority.HIGH.toString()) {
      return { label: 'Alta', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100/80' };
    } else if (priorityStr === 'crítica' || priorityStr === 'critica' || priorityStr === TicketPriority.CRITICAL?.toString?.()) {
      return { label: 'Crítica', className: 'bg-red-100 text-red-800 hover:bg-red-100/80' };
    } else {
      return { label: String(priority), className: 'bg-gray-100 text-gray-800' };
    }
  };

  const { label, className } = getPriorityConfig();

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}
