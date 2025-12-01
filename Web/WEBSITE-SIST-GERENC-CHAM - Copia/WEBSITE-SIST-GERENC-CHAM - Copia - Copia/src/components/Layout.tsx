
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNavigationBlocker } from '../contexts/NavigationBlockerContext';
import { Button } from "@/components/ui/button";
import { UserMenu } from './UserMenu';
import { 
  FileText, 
  Home, 
  Search, 
  Users, 
  LogOut,
  CalendarCheck,
  Bot
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isCollaborator, isTechnician, isAdmin } = useAuth();
  const navigate = useNavigate();
  const navigationBlocker = useNavigationBlocker();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Função para navegar com verificação de bloqueio
  const handleNavigateWithBlock = (destination: string) => {
    if (navigationBlocker.isNavigationBlocked) {
      navigationBlocker.setPendingDestination(destination);
      navigationBlocker.setShowConfirmDialog(true);
    } else {
      navigate(destination);
    }
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden max-w-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-16 lg:w-20 bg-teal-600 text-white flex-col items-center py-4 lg:py-6 fixed left-0 top-0 h-screen z-10">
        <div className="mb-6 lg:mb-8">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-teal-700 w-10 h-10 lg:w-12 lg:h-12"
            onClick={() => handleNavigateWithBlock(isTechnician ? '/technician-dashboard' : '/')}
            title={isTechnician ? "Dashboard Técnico" : "Home"}
          >
            <Bot className="w-7 h-7 lg:w-8 lg:h-8" />
          </Button>
        </div>
        
        <nav className="flex-1 flex flex-col items-center gap-3 lg:gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-teal-700 w-10 h-10 lg:w-12 lg:h-12"
            onClick={() => handleNavigateWithBlock('/')}
            title="Dashboard"
          >
            <Home className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
          
          {/* Meus Chamados para colaboradores */}
          {isCollaborator && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-teal-700 w-10 h-10 lg:w-12 lg:h-12"
              onClick={() => handleNavigateWithBlock('/my-tickets')}
              title="Meus Chamados"
            >
              <FileText className="w-5 h-5 lg:w-6 lg:h-6" />
            </Button>
          )}

          {/* Base de Conhecimento: disponível para colaboradores e administradores (não para técnicos) */}
          {(isCollaborator || isAdmin) && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-teal-700 w-10 h-10 lg:w-12 lg:h-12"
              onClick={() => handleNavigateWithBlock('/knowledge-base')}
              title="Base de Conhecimento"
            >
              <Search className="w-5 h-5 lg:w-6 lg:h-6" />
            </Button>
          )}

          {/* Gerenciamento de Chamados para técnicos */}
          {isTechnician && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-teal-700 w-10 h-10 lg:w-12 lg:h-12"
              onClick={() => handleNavigateWithBlock('/technician/ticket-management')}
              title="Gerenciamento de Chamados"
            >
              <FileText className="w-5 h-5 lg:w-6 lg:h-6" />
            </Button>
          )}

          {isAdmin && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-teal-700 w-10 h-10 lg:w-12 lg:h-12"
                onClick={() => handleNavigateWithBlock('/users')}
                title="Usuários"
              >
                <Users className="w-5 h-5 lg:w-6 lg:h-6" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-teal-700 w-10 h-10 lg:w-12 lg:h-12"
                onClick={() => handleNavigateWithBlock('/reports')}
                title="Relatórios"
              >
                <FileText className="w-5 h-5 lg:w-6 lg:h-6" />
              </Button>
            </>
          )}
        </nav>

        <div className="mt-auto">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-red-600 w-10 h-10 lg:w-12 lg:h-12"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col md:ml-16 lg:ml-20 overflow-hidden max-w-full">
        <header className="bg-white h-14 md:h-16 border-b border-gray-200 flex items-center justify-between px-3 md:px-4 lg:px-6 shadow-sm fixed top-0 right-0 md:left-16 lg:left-20 left-0 z-10">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 text-primary" />
            <h2 className="text-xl md:text-2xl lg:text-3xl font-semibold">
              HelpDesk IA
            </h2>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-auto mt-14 md:mt-16 max-w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
