import React, { createContext, useState, useContext, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiPost, apiGet, setAuthToken, clearAuthToken, getAuthToken } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  isCollaborator: boolean;
  isTechnician: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    const token = getAuthToken();
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('currentUser');
        clearAuthToken();
      }
    }
    setLoading(false);
  }, []);

  // Listen for auth logout events (from 401 responses)
  useEffect(() => {
    const handleAuthLogout = () => {
      setUser(null);
      localStorage.removeItem('currentUser');
    };
    
    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);


  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 1. Fazer login com credenciais (usar login e senha, não email e password)
      const loginResp = await apiPost('/api/auth/login', { login: email, senha: password });
      
      console.log('=== RESPOSTA DO LOGIN ===');
      console.log('Login response:', loginResp);
      
      if (loginResp && loginResp.id) {
        // Backend retorna: { id, nome, login, nivelAcesso }
        // nivelAcesso é uma string: "Administrador", "Técnico", "Colaborador"
        
        const roleValue = loginResp.nivelAcesso || '';
        console.log('Role extraído:', roleValue);
        
        const mappedRole = mapRole(roleValue);
        console.log('Role mapeado:', mappedRole);
        
        const mappedUser: User = {
          id: loginResp.id || '1',
          name: loginResp.nome || 'Usuário',
          email: loginResp.login || email,
          role: mappedRole,
          department: 'Geral',
          avatarUrl: `https://i.pravatar.cc/150?u=${loginResp.login || email}`,
        };
        
        console.log('Usuário mapeado final:', mappedUser);
        
        setUser(mappedUser);
        localStorage.setItem('currentUser', JSON.stringify(mappedUser));
        console.log('Login bem-sucedido:', mappedUser.name, 'Role:', mappedUser.role);
        return true;
      }
    } catch (err: any) {
      console.error('Erro no login:', err?.message);
      return false;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    clearAuthToken();
  };

  const mapRole = (role: any): UserRole => {
    if (!role) return UserRole.COLLABORATOR;
    
    const roleStr = role.toString().toLowerCase().trim();
    
    // Backend retorna strings: "Administrador", "Técnico", "Colaborador"
    if (roleStr.includes('admin')) return UserRole.ADMINISTRATOR;
    if (roleStr.includes('técnico') || roleStr.includes('tecnico') || roleStr.includes('technician')) return UserRole.TECHNICIAN;
    if (roleStr.includes('colaborador') || roleStr.includes('collaborator')) return UserRole.COLLABORATOR;
    
    // Fallback: números (1 = Admin, 2 = Técnico, 3 = Colaborador)
    const roleNum = typeof role === 'number' ? role : parseInt(roleStr);
    if (roleNum === 1) return UserRole.ADMINISTRATOR;
    if (roleNum === 2) return UserRole.TECHNICIAN;
    if (roleNum === 3) return UserRole.COLLABORATOR;
    
    return UserRole.COLLABORATOR;
  };

  const isAuthenticated = !!user;
  const isCollaborator = user?.role === UserRole.COLLABORATOR;
  const isTechnician = user?.role === UserRole.TECHNICIAN;
  const isAdmin = user?.role === UserRole.ADMINISTRATOR;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated,
        isCollaborator,
        isTechnician,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
