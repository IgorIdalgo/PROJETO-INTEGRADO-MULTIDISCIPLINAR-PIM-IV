import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      // If user is authenticated, redirect to dashboard
      // Otherwise, redirect to login
      if (isAuthenticated) {
        navigate('/dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [navigate, isAuthenticated, loading]);

  // Display a loading state while checking authentication
  return (
    <div className="flex items-center justify-center h-screen bg-support-teal">
      <div className="text-white">Carregando...</div>
    </div>
  );
};

export default Index;
