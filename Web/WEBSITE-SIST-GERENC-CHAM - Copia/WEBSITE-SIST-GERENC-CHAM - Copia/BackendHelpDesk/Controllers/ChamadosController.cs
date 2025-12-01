using Microsoft.AspNetCore.Mvc;
using BackendHelpDesk.Business.Services;
using BackendHelpDesk.Models;
using System;

namespace BackendHelpDesk.Api.Controllers
{
    [ApiController]
    [Route("api/chamados")]
    public class ChamadosController : ControllerBase
    {
        private readonly AzureApiService _azureApiService;
        private readonly ILogger<ChamadosController> _logger;

        public ChamadosController(AzureApiService azureApiService, ILogger<ChamadosController> logger)
        {
            _azureApiService = azureApiService;
            _logger = logger;
        }

        private string? GetToken()
        {
            var authHeader = Request.Headers["Authorization"].ToString();
            if (string.IsNullOrEmpty(authHeader)) return null;
            return authHeader.Replace("Bearer ", "").Trim();
        }

        // Listar todos os chamados (Admin/Tecnico)
        [HttpGet("todos")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                var chamados = await _azureApiService.GetTodosChamadosAsync(token);
                return Ok(chamados);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao listar chamados");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Listar meus chamados
        [HttpGet]
        public async Task<IActionResult> GetMeus()
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                var chamados = await _azureApiService.GetMeusChamadosAsync(token);
                return Ok(chamados);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao listar meus chamados");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Criar chamado
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ChamadoDto dto)
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                var chamado = await _azureApiService.CriarChamadoAsync(token, dto);
                return Created($"/api/chamados/{chamado.Id}", chamado);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao criar chamado");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Atualizar chamado (status/prioridade)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] ChamadoUpdateDto dto)
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                await _azureApiService.UpdateChamadoAsync(token, id, dto);
                return Ok(new { message = "Chamado atualizado com sucesso" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao atualizar chamado {Id}", id);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Atribuir técnico
        [HttpPut("{id}/atribuir")]
        public async Task<IActionResult> Atribuir(long id, [FromBody] dynamic dto)
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                // Extrair ID do técnico do JSON
                if (dto is System.Text.Json.JsonElement jsonElement)
                {
                    var idTecnicoStr = jsonElement.GetProperty("id_tecnico").GetString();
                    if (Guid.TryParse(idTecnicoStr, out var idTecnico))
                    {
                        await _azureApiService.AtribuirChamadoAsync(token, id, idTecnico);
                        return Ok(new { message = "Chamado atribuído com sucesso" });
                    }
                }

                return BadRequest(new { message = "ID do técnico inválido" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao atribuir chamado {Id}", id);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Listar comentários
        [HttpGet("{id}/comentarios")]
        public async Task<IActionResult> GetComentarios(long id)
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                var comentarios = await _azureApiService.GetComentariosAsync(token, id);
                return Ok(comentarios);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao listar comentários");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Criar comentário
        [HttpPost("{id}/comentarios")]
        public async Task<IActionResult> CreateComentario(long id, [FromBody] ComentarioDto dto)
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                var comentario = await _azureApiService.CriarComentarioAsync(token, id, dto);
                return Created($"/api/chamados/{id}/comentarios/{comentario.Id}", comentario);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao criar comentário");
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }

    public class AtribuirRequest
    {
        public Guid TecnicoId { get; set; }
    }
}
