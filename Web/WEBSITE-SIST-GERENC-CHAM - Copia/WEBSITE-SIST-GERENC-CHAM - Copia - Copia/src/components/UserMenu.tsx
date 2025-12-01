
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function UserMenu() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Função para gerar avatar URL baseado no role do usuário
  const getAvatarUrl = () => {
    if (user.role === 'technician') {
      // Avatar específico para técnicos
      return `https://i.pravatar.cc/150?u=technician@helpdesk.com`;
    }
    return user.avatarUrl || `https://i.pravatar.cc/150?u=${user.email}`;
  };

  // Função para exibir o rótulo de role em português
  const getRoleLabel = () => {
    const roleMap: Record<string, string> = {
      'technician': 'tecnico',
      'collaborator': 'colaborador',
      'administrator': 'administrador'
    };
    return roleMap[user.role] || user.role;
  };

  return (
    <div className="flex items-center space-x-2">
      <Avatar>
        <AvatarImage src={getAvatarUrl()} alt={user.role === 'technician' ? 'tecnico' : user.name} />
        <AvatarFallback className="bg-primary text-primary-foreground">
          {user.role === 'technician' ? 'TC' : getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="hidden md:block text-left">
        <p className="text-sm font-medium">{user.role === 'technician' ? 'tecnico' : user.name}</p>
        <p className="text-xs text-gray-500">{getRoleLabel()}</p>
      </div>
    </div>
  );
}
