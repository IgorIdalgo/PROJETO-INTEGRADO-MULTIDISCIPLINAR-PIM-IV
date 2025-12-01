using System.Text.Json;
using System.Net.Http.Json;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Business.Services
{
    /// <summary>
    /// Centraliza todas as chamadas para a API do Azure.
    /// Sem fallback - se Azure não responder, falha.
    /// </summary>
    public class AzureApiService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly string _baseUrl;

        public AzureApiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _baseUrl = configuration["AzureApi:BaseUrl"] ?? 
                throw new InvalidOperationException("Azure API URL não configurada");
        }

        /// <summary>
        /// GET /api/chamados - Retorna todos os chamados (Admin/Tecnico)
        /// </summary>
        public async Task<List<Chamado>> GetTodosChamadosAsync(string token)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/api/chamados/todos");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var chamados = JsonSerializer.Deserialize<List<Chamado>>(json, 
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Chamado>();

                return chamados;
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao obter chamados do Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// GET /api/chamados/meus - Retorna chamados do usuário logado
        /// </summary>
        public async Task<List<Chamado>> GetMeusChamadosAsync(string token)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/api/chamados/meus");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var chamados = JsonSerializer.Deserialize<List<Chamado>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Chamado>();

                return chamados;
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao obter meus chamados do Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// POST /api/chamados - Cria novo chamado
        /// </summary>
        public async Task<Chamado> CriarChamadoAsync(string token, ChamadoDto dto)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/api/chamados");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                request.Content = JsonContent.Create(dto);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var chamado = JsonSerializer.Deserialize<Chamado>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) 
                    ?? throw new InvalidOperationException("Resposta inválida do Azure");

                return chamado;
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao criar chamado no Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// PUT /api/chamados/{id} - Atualiza status/prioridade do chamado
        /// </summary>
        public async Task UpdateChamadoAsync(string token, long id, ChamadoUpdateDto dto)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Put, $"{_baseUrl}/api/chamados/{id}");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                request.Content = JsonContent.Create(dto);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao atualizar chamado no Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// PUT /api/chamados/{id}/atribuir - Atribui técnico ao chamado
        /// </summary>
        public async Task AtribuirChamadoAsync(string token, long id, Guid idTecnico)
        {
            try
            {
                var dto = new { id_tecnico = idTecnico };
                var request = new HttpRequestMessage(HttpMethod.Put, $"{_baseUrl}/api/chamados/{id}/atribuir");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                request.Content = JsonContent.Create(dto);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao atribuir chamado no Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// GET /api/chamados/{id}/comentarios - Lista comentários do chamado
        /// </summary>
        public async Task<List<Comentario>> GetComentariosAsync(string token, long idChamado)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/api/chamados/{idChamado}/comentarios");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var comentarios = JsonSerializer.Deserialize<List<Comentario>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Comentario>();

                return comentarios;
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao obter comentários do Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// POST /api/chamados/{id}/comentarios - Cria novo comentário
        /// </summary>
        public async Task<Comentario> CriarComentarioAsync(string token, long idChamado, ComentarioDto dto)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Post, $"{_baseUrl}/api/chamados/{idChamado}/comentarios");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                request.Content = JsonContent.Create(dto);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var comentario = JsonSerializer.Deserialize<Comentario>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
                    ?? throw new InvalidOperationException("Resposta inválida do Azure");

                return comentario;
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao criar comentário no Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// GET /api/usuarios - Lista todos os usuários (Admin)
        /// </summary>
        public async Task<List<Usuario>> GetUsuariosAsync(string token)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Get, $"{_baseUrl}/api/usuarios");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var usuarios = JsonSerializer.Deserialize<List<Usuario>>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? new List<Usuario>();

                return usuarios;
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao obter usuários do Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// PUT /api/usuarios/{id} - Atualiza usuário (Admin)
        /// </summary>
        public async Task UpdateUsuarioAsync(string token, Guid id, UsuarioUpdateDto dto)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Put, $"{_baseUrl}/api/usuarios/{id}");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
                request.Content = JsonContent.Create(dto);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao atualizar usuário no Azure: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// DELETE /api/usuarios/{id} - Inativa usuário (Admin)
        /// </summary>
        public async Task DeleteUsuarioAsync(string token, Guid id)
        {
            try
            {
                var request = new HttpRequestMessage(HttpMethod.Delete, $"{_baseUrl}/api/usuarios/{id}");
                request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException ex)
            {
                throw new InvalidOperationException($"Erro ao deletar usuário no Azure: {ex.Message}", ex);
            }
        }
    }

    /// <summary>
    /// DTOs para comunicação com Azure API
    /// </summary>
    public class ChamadoDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string Descricao { get; set; } = string.Empty;
        public int IdCategoria { get; set; }
        public string Urgencia { get; set; } = string.Empty;
    }

    public class ChamadoUpdateDto
    {
        public string? Status { get; set; }
        public string? Prioridade { get; set; }
    }

    public class ComentarioDto
    {
        public string Comentario { get; set; } = string.Empty;
    }

    public class UsuarioUpdateDto
    {
        public string NomeCompleto { get; set; } = string.Empty;
        public int IdPerfil { get; set; }
        public bool Ativo { get; set; }
    }
}
