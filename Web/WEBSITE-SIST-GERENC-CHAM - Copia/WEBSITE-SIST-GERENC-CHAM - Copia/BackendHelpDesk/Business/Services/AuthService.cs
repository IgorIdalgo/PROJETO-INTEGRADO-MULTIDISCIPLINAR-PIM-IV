using BackendHelpDesk.Data.Repositories;
using BackendHelpDesk.Models;
using System.Net.Http.Json;
using System.Text.Json;

namespace BackendHelpDesk.Business.Services
{
    // Serviço de autenticação que chama a API do Azure
    public class AuthService
    {
        private readonly IUsuarioRepository _usuarioRepo;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public AuthService(IUsuarioRepository usuarioRepo, IConfiguration configuration, HttpClient httpClient)
        {
            _usuarioRepo = usuarioRepo;
            _configuration = configuration;
            _httpClient = httpClient;
        }

        // Autentica chamando SEMPRE a API do Azure (sem fallback)
        public async Task<Usuario?> AutenticarAsync(string login, string senha)
        {
            var azureUrl = _configuration["AzureApi:BaseUrl"];
            if (string.IsNullOrEmpty(azureUrl))
            {
                throw new InvalidOperationException("Azure API URL não configurada em appsettings.json");
            }

            try
            {
                // Chamar API do Azure
                var response = await _httpClient.PostAsJsonAsync(
                    $"{azureUrl}/api/usuarios/autenticar",
                    new { login, senha }
                );

                if (response.IsSuccessStatusCode)
                {
                    var jsonContent = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(jsonContent);
                    var root = doc.RootElement;
                    
                    // Mapear resposta da API para modelo local
                    var user = new Usuario
                    {
                        Id = Guid.Parse(root.GetProperty("id").GetString() ?? Guid.NewGuid().ToString()),
                        Nome = root.GetProperty("nome").GetString() ?? "",
                        Login = root.GetProperty("login").GetString() ?? "",
                        Senha = senha, // Não retornamos a senha da API
                        NivelAcesso = MapearNivelAcesso(root.GetProperty("nivelAcesso").GetString() ?? "")
                    };

                    return user;
                }
                else if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
                {
                    return null; // Credenciais inválidas
                }
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao conectar com Azure API: {ex.Message}", ex);
            }

            return null;
        }

        // Mapear string de nível de acesso para enum
        private NivelAcesso MapearNivelAcesso(string nivelAcesso)
        {
            return nivelAcesso?.ToLower() switch
            {
                "administrador" or "admin" => NivelAcesso.Administrador,
                "técnico" or "tecnico" or "technician" => NivelAcesso.Tecnico,
                "colaborador" or "collaborator" => NivelAcesso.Colaborador,
                _ => NivelAcesso.Colaborador
            };
        }
    }
}

