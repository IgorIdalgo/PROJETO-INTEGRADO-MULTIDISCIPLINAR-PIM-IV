using BackendHelpDesk.Data.Repositories;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Business.Services
{
    // Serviço de autenticação SIMPLIFICADO (sem JWT).
    // Retorna o usuário quando a combinação login/senha estiver correta.
    public class AuthService
    {
        private readonly IUsuarioRepository _usuarioRepo;

        public AuthService(IUsuarioRepository usuarioRepo)
        {
            _usuarioRepo = usuarioRepo;
        }

        // Autentica e retorna o usuário (ou null se inválido)
        public Usuario? Autenticar(string login, string senha)
        {
            // Em produção, a senha deve ser armazenada com hash e comparada com segurança.
            var user = _usuarioRepo.ObterPorLogin(login);
            if (user == null) return null;
            if (user.Senha != senha) return null;
            return user;
        }
    }
}
