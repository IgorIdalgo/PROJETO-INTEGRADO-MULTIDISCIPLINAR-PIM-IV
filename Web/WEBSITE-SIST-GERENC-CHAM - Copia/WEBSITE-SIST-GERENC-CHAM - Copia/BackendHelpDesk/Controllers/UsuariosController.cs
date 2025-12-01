using Microsoft.AspNetCore.Mvc;
using BackendHelpDesk.Business.Services;
using BackendHelpDesk.Models;
using System;

namespace BackendHelpDesk.Api.Controllers
{
    [ApiController]
    [Route("api/usuarios")]
    public class UsuariosController : ControllerBase
    {
        private readonly AzureApiService _azureApiService;
        private readonly ILogger<UsuariosController> _logger;

        public UsuariosController(AzureApiService azureApiService, ILogger<UsuariosController> logger)
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

        // Listar todos os usuários (Admin)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                var usuarios = await _azureApiService.GetUsuariosAsync(token);
                return Ok(usuarios);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao listar usuários");
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Atualizar usuário (Admin)
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] UsuarioUpdateDto dto)
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                await _azureApiService.UpdateUsuarioAsync(token, id, dto);
                return Ok(new { message = "Usuário atualizado com sucesso" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao atualizar usuário {Id}", id);
                return StatusCode(500, new { message = ex.Message });
            }
        }

        // Inativar usuário (Admin)
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            try
            {
                var token = GetToken();
                if (string.IsNullOrEmpty(token))
                    return Unauthorized(new { message = "Token não fornecido" });

                await _azureApiService.DeleteUsuarioAsync(token, id);
                return Ok(new { message = "Usuário inativado com sucesso" });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogError(ex, "Erro ao deletar usuário {Id}", id);
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
