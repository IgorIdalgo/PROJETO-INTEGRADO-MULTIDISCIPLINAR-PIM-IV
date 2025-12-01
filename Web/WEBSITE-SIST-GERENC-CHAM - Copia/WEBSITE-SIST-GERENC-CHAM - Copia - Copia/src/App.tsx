
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { NavigationBlockerProvider } from "./contexts/NavigationBlockerContext";
import { Layout } from "./components/Layout";
import { SidebarProvider } from "@/components/ui/sidebar";

// Pages
import Dashboard from "./pages/Dashboard";
import TechnicianDashboard from "./pages/TechnicianDashboard";
import AssignedTickets from "./pages/AssignedTickets";
import SlaTodayTickets from "./pages/SlaTodayTickets";
import OpenTickets from "./pages/OpenTickets";
import Login from "./pages/Login";
import NewTicket from "./pages/NewTicket";
import TicketDetail from "./pages/TicketDetail";
import AllTickets from "./pages/AllTickets";
import MyTickets from "./pages/MyTickets";
import KnowledgeBase from "./pages/KnowledgeBase";
import ArticleDetail from "./pages/ArticleDetail";
import ArticleNotFound from "./pages/ArticleNotFound";
import UserManagement from "./pages/UserManagement";
import AdminDashboard from "./pages/AdminDashboard";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";
import ManageTickets from "./pages/ManageTickets";
import TicketManagement from "./pages/TicketManagement";
import TicketDetailPage from "./pages/TicketDetailPage";

// Protected route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Redirect based on user role
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  console.log('=== ROLE BASED REDIRECT ===');
  console.log('User:', user);
  console.log('User role:', user.role);
  console.log('User role type:', typeof user.role);
  console.log('Is admin check:', user.role === "administrator");

  // Admin vai para gerenciamento de usuários
  if (user.role === "administrator") {
    console.log('Redirecionando para /admin-dashboard');
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Técnico vai para o dashboard do técnico
  if (user.role === "technician") {
    console.log('Redirecionando para /technician-dashboard');
    return <Navigate to="/technician-dashboard" replace />;
  }

  // Colaborador vai para o dashboard padrão
  console.log('Redirecionando para /dashboard');
  return <Navigate to="/dashboard" replace />;
};

// Redirect if already authenticated
const RedirectIfAuthenticated = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

// Knowledge Base route wrapper to block technician access
const KBProtected = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  if (user?.role === 'technician') {
    return <Navigate to="/technician-dashboard" replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <NavigationBlockerProvider>
          <Routes>
            <Route 
              path="/login" 
              element={
                <RedirectIfAuthenticated>
                  <Login />
                </RedirectIfAuthenticated>
              } 
            />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <RoleBasedRedirect />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <Dashboard />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/technician-dashboard" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <TechnicianDashboard />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/technician/manage" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <ManageTickets />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/technician/ticket-management" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <TicketManagement />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/technician/ticket/:id" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <TicketDetailPage />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/technician/assigned" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <AssignedTickets />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/technician/sla-today" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <SlaTodayTickets />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/technician/open" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <OpenTickets />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/new-ticket" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <NewTicket />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tickets/:id" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <TicketDetail />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/all-tickets" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <AllTickets />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/my-tickets" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <MyTickets />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/knowledge-base" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <KBProtected>
                        <KnowledgeBase />
                      </KBProtected>
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/knowledge-base/:id" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <KBProtected>
                        <ArticleDetail />
                      </KBProtected>
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/article-not-found" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <ArticleNotFound />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reports" 
              element={
                <ProtectedRoute>
                  <SidebarProvider>
                    <Layout>
                      <Reports />
                    </Layout>
                  </SidebarProvider>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="*" 
              element={
                <SidebarProvider>
                  <Layout>
                    <NotFound />
                  </Layout>
                </SidebarProvider>
              } 
            />
          </Routes>
          </NavigationBlockerProvider>
        </BrowserRouter>
        </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
