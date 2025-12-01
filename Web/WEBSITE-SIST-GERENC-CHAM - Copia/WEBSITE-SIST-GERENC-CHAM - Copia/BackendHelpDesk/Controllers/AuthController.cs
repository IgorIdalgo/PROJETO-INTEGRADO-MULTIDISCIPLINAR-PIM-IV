using Microsoft.AspNetCore.Mvc;
using BackendHelpDesk.Business.Services;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(AuthService authService, ILogger<AuthController> logger)
        {
            _authService = authService;
            _logger = logger;
        }

        // Endpoint de login simplificado. NÃO gera JWT (conforme solicitado).
        // Retorna os dados do usuário autenticado ou 401 Unauthorized.
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                var user = await _authService.AutenticarAsync(req.Login ?? string.Empty, req.Senha ?? string.Empty);
                if (user == null) return Unauthorized(new { message = "Credenciais inválidas." });

                // Exemplo: retornar informações do usuário para a camada frontend usar na sessão.
                return Ok(new {
                    id = user.Id,
                    nome = user.Nome,
                    login = user.Login,
                    nivelAcesso = user.NivelAcesso.ToString()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro no Login");
                return StatusCode(500, new { message = "Erro interno no servidor." });
            }
        }

        // DTO de requisição de login
        public class LoginRequest
        {
            public string? Login { get; set; }
            public string? Senha { get; set; }
        }
    }
}
