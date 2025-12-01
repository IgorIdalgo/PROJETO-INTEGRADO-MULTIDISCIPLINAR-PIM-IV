//utiliza hooks e componentes para criar a página de login do sistema HelpDesk
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeClosed, Bot, Sparkles, ArrowRight } from "lucide-react"; //importa ícones específicos da biblioteca lucide-react
import { UserRole } from "@/types"; //importa tipos de usuário

export default function Login() { //componente funcional React para a página de login. Permite que o usuário insira suas credenciais e chama o serviço de autenticação.
 // Estados para armazenar email, senha, estado de carregamento, mensagem de erro e visibilidade da senha
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) { // Validação simples de campos obrigatórios
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive", //estilo visual de notificação para erro
      });
      return;
    }
    
    setIsLoading(true);
    
    try {// Tenta realizar o login com as credenciais fornecidas
      setErrorMsg(null);
      const success = await login(email, password);
      if (success) {
        toast({ title: "Login realizado com sucesso", description: "Bem-vindo ao sistema HelpDesk." });//notificação temporária
        
        // Redireciona para página inicial (App.tsx vai fazer o redirecionamento baseado no role)
        navigate("/");
      } else {
        setErrorMsg("Credenciais inválidas. Verifique usuário/senha ou solicite criação de acesso.");
        toast({ title: "Falha no login", description: "Credenciais incorretas ou não registradas entre em contato com um administrador.", variant: "destructive" });
      }
    } catch (error: any) { // Captura erros inesperados durante o processo de login
      console.error("Login error:", error);
      const detail = error?.message || "Erro inesperado ao comunicar com a API.";
      setErrorMsg(detail);
      toast({ title: "Erro no login", description: detail, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return ( //estrutura JSX da página de login, incluindo campos de entrada, botões e mensagens de erro
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-teal-400 via-teal-500 to-cyan-600 relative overflow-hidden">
      {/* Elementos decorativos de fundo */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-24 -mt-24" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24" />
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-cyan-300/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />

      {/* Container principal */}
      <div className="relative w-full max-w-md px-4 z-10">
        {/* Header com logo */}
        <div className="flex flex-col items-center mb-12">
          <div className="relative mb-6">
            {/* Background do ícone */}
            <div className="absolute inset-0 bg-gradient-to-br from-teal-200 to-cyan-200 rounded-3xl blur-xl opacity-40" />
            
            {/* Ícone principal */}
            <div className="relative bg-white/95 backdrop-blur-sm p-6 rounded-3xl shadow-2xl border border-white/40">
              <div className="relative">
                <Bot size={56} className="text-teal-600" strokeWidth={1.5} />
                <Sparkles size={28} className="text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Título e descrição */}
          <div className="text-center">
            <h1 className="text-5xl font-black text-white mb-2 drop-shadow-lg">
              HelpDesk IA
            </h1>
            <p className="text-lg text-white/90 font-light drop-shadow-md">
              Sistema Inteligente de Suporte
            </p>
          </div>
        </div>

        {/* Formulário de login */}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
          {/* Header do card */}
          <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">Bem-vindo</h2>
            <p className="text-sm text-white/90 mt-1">Entre com suas credenciais</p>
          </div>

          {/* Conteúdo do formulário */}
          <form onSubmit={handleLogin} className="p-8 space-y-6">
            {/* Campo de email */}
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="seu.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white transition-all placeholder:text-gray-400 text-gray-700"
                required
              />
            </div>

            {/* Campo de senha */}
            <div className="space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:bg-white transition-all placeholder:text-gray-400 text-gray-700 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-teal-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeClosed size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Mensagem de erro */}
            {errorMsg && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-red-600 font-bold text-sm">!</span>
                </div>
                <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
              </div>
            )}

            {/* Botão de login */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-13 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-bold rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>

            {/* Footer informativo */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                Problemas de acesso? Entre em contato com seu administrador
              </p>
            </div>
          </form>
        </div>

        {/* Informação adicional */}
        <div className="mt-8 text-center">
          <p className="text-white/80 text-sm drop-shadow-md">
            Fique tranquilo, sua conexão é segura
          </p>
        </div>
      </div>
    </div>
  );
}
