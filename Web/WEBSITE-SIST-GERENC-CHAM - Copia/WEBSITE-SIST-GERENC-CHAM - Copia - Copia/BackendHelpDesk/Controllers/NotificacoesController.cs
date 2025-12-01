using Microsoft.AspNetCore.Mvc;
using BackendHelpDesk.Business.Services;
using System;

namespace BackendHelpDesk.Api.Controllers
{
    [ApiController]
    [Route("api/notificacoes")]
    public class NotificacoesController : ControllerBase
    {
        private readonly NotificacaoService _service;
        private readonly ILogger<NotificacoesController> _logger;

        public NotificacoesController(NotificacaoService service, ILogger<NotificacoesController> logger)
        {
            _service = service;
            _logger = logger;
        }

        // Listar notificações do usuário
        [HttpGet("usuario/{usuarioId:guid}")]
        public IActionResult GetByUsuario(Guid usuarioId)
        {
            try
            {
                _logger.LogInformation("Buscando notificações para usuário {UsuarioId}", usuarioId);
                var notificacoes = _service.ListarPorUsuario(usuarioId);
                _logger.LogInformation("Encontradas {Count} notificações", notificacoes.Count());
                return Ok(notificacoes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar notificações do usuário {UsuarioId}", usuarioId);
                return StatusCode(500, new { message = "Erro ao listar notificações" });
            }
        }

        // Listar notificações não lidas do usuário
        [HttpGet("usuario/{usuarioId:guid}/nao-lidas")]
        public IActionResult GetNaoLidasByUsuario(Guid usuarioId)
        {
            try
            {
                var notificacoes = _service.ListarNaoLidasPorUsuario(usuarioId);
                return Ok(notificacoes);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar notificações não lidas do usuário {UsuarioId}", usuarioId);
                return StatusCode(500, new { message = "Erro ao listar notificações não lidas" });
            }
        }

        // Marcar notificação como lida
        [HttpPatch("{id:guid}/marcar-lida")]
        public IActionResult MarcarComoLida(Guid id)
        {
            try
            {
                _service.MarcarComoLida(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao marcar notificação {Id} como lida", id);
                return StatusCode(500, new { message = "Erro ao marcar notificação como lida" });
            }
        }

        // Marcar todas as notificações do usuário como lidas
        [HttpPatch("usuario/{usuarioId:guid}/marcar-todas-lidas")]
        public IActionResult MarcarTodasComoLidas(Guid usuarioId)
        {
            try
            {
                _service.MarcarTodasComoLidas(usuarioId);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao marcar todas notificações do usuário {UsuarioId} como lidas", usuarioId);
                return StatusCode(500, new { message = "Erro ao marcar todas notificações como lidas" });
            }
        }
    }
}
