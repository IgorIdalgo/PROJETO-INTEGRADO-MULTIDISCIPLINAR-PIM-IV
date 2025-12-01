
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, UserRole } from "@/types";
import { apiGet } from "@/lib/api";
import { Search, PlusCircle, Edit, UserCheck, UserX, Loader2 } from "lucide-react";

export default function UserManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");

  // Fetch users from API
  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log("🔍 Carregando usuários da API...");
        const response = await apiGet('/api/usuarios');
        console.log("📊 Resposta da API de usuários:", response);
        
        // Processar resposta - pode vir como array direto ou dentro de um objeto
        let usersList: User[] = [];
        if (Array.isArray(response)) {
          usersList = response.map((u: any) => ({
            id: u.id,
            name: u.nome || u.name || 'Sem nome',
            email: u.login || u.email || 'Sem email',
            role: u.nivelAcesso === 1 ? UserRole.ADMINISTRATOR : 
                  u.nivelAcesso === 2 ? UserRole.TECHNICIAN : 
                  UserRole.COLLABORATOR,
            department: u.departamento || u.department || 'N/A',
            avatarUrl: u.avatarUrl
          }));
        }
        
        console.log("👥 Lista de usuários processada:", usersList.length, "usuários");
        setUsers(usersList);
      } catch (error: any) {
        console.error("❌ Erro ao carregar usuários:", error);
        console.error("⚠️ O endpoint /api/usuarios não está disponível na API do Azure");
        console.error("⚠️ Certifique-se de que o UsuariosController foi publicado no Azure");
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, []);
  
  // Check if the current user is an administrator
  if (user?.role !== UserRole.ADMINISTRATOR) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Acesso Restrito</h2>
        <p className="text-muted-foreground mb-4">
          Você não tem permissão para acessar esta página.
        </p>
        <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
      </div>
    );
  }
  
  // Filter users based on search and role filter
  const filteredUsers = users.filter(u => {
    const matchesSearch = searchQuery === "" || 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.department?.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Function to get role display information
  const getRoleInfo = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMINISTRATOR:
        return { label: 'Administrador', color: 'bg-red-100 text-red-800' };
      case UserRole.TECHNICIAN:
        return { label: 'Técnico', color: 'bg-blue-100 text-blue-800' };
      case UserRole.COLLABORATOR:
        return { label: 'Colaborador', color: 'bg-green-100 text-green-800' };
      default:
        return { label: role, color: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
        <Button onClick={() => navigate("/new-user")}>
          <PlusCircle size={16} className="mr-2" />
          Novo Usuário
        </Button>
      </div>
      
      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div>
            <div className="flex space-x-2">
              <Button 
                variant={roleFilter === "all" ? "default" : "outline"} 
                size="sm" 
                onClick={() => setRoleFilter("all")}
                className="flex-1"
              >
                Todos
              </Button>
              <Button 
                variant={roleFilter === UserRole.ADMINISTRATOR ? "default" : "outline"} 
                size="sm" 
                onClick={() => setRoleFilter(UserRole.ADMINISTRATOR)}
                className="flex-1"
              >
                Admins
              </Button>
              <Button 
                variant={roleFilter === UserRole.TECHNICIAN ? "default" : "outline"} 
                size="sm" 
                onClick={() => setRoleFilter(UserRole.TECHNICIAN)}
                className="flex-1"
              >
                Técnicos
              </Button>
              <Button 
                variant={roleFilter === UserRole.COLLABORATOR ? "default" : "outline"} 
                size="sm" 
                onClick={() => setRoleFilter(UserRole.COLLABORATOR)}
                className="flex-1"
              >
                Colaboradores
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Users List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            Nenhum usuário encontrado
          </div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-4 px-4 py-2 font-medium text-sm text-muted-foreground bg-muted rounded-md">
              <div className="col-span-4 md:col-span-3">Nome</div>
              <div className="hidden md:block md:col-span-3">Email</div>
              <div className="col-span-3 md:col-span-2">Departamento</div>
              <div className="col-span-3 md:col-span-2">Função</div>
              <div className="col-span-2 md:col-span-2 text-right">Ações</div>
            </div>
            
            {filteredUsers.map((user) => {
          const roleInfo = getRoleInfo(user.role);
          
          return (
            <div
              key={user.id}
              className="grid grid-cols-12 gap-4 px-4 py-3 border rounded-md items-center"
            >
              <div className="col-span-4 md:col-span-3 flex items-center">
                <Avatar className="h-8 w-8 mr-3">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium truncate">{user.name}</span>
              </div>
              <div className="hidden md:block md:col-span-3 truncate">{user.email}</div>
              <div className="col-span-3 md:col-span-2">{user.department}</div>
              <div className="col-span-3 md:col-span-2">
                <Badge className={roleInfo.color} variant="outline">
                  {roleInfo.label}
                </Badge>
              </div>
              <div className="col-span-2 md:col-span-2 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => navigate(`/users/${user.id}/edit`)}>
                  <Edit size={16} />
                </Button>
                <Button variant="ghost" size="icon">
                  {user.id === "2" || user.id === "5" ? (
                    <UserX size={16} className="text-red-500" />
                  ) : (
                    <UserCheck size={16} className="text-green-500" />
                  )}
                </Button>
              </div>
            </div>
          );
        })}
          </>
        )}
      </div>
    </div>
  );
}
