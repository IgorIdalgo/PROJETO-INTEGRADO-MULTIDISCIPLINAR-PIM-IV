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
        private readonly ChamadoService _service;
        private readonly NotificacaoService _notificacaoService;
        private readonly ILogger<ChamadosController> _logger;

        public ChamadosController(ChamadoService service, NotificacaoService notificacaoService, ILogger<ChamadosController> logger)
        {
            _service = service;
            _notificacaoService = notificacaoService;
            _logger = logger;
        }

        // Listar todos os chamados
        [HttpGet]
        [HttpGet("todos")]
        public IActionResult GetAll()
        {
            try
            {
                var items = _service.Listar();
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar chamados");
                return StatusCode(500, new { message = "Erro ao listar chamados" });
            }
        }

        // Obter por id
        [HttpGet("{id:guid}")]
        public IActionResult GetById(Guid id)
        {
            try
            {
                var c = _service.ObterPorId(id);
                if (c == null) return NotFound();
                return Ok(c);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter chamado {Id}", id);
                return StatusCode(500, new { message = "Erro ao obter chamado" });
            }
        }

        // Listar por usuário
        [HttpGet("por-usuario/{usuarioId:guid}")]
        public IActionResult GetByUsuario(Guid usuarioId)
        {
            try
            {
                var items = _service.ListarPorUsuario(usuarioId);
                return Ok(items);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar chamados por usuário {UsuarioId}", usuarioId);
                return StatusCode(500, new { message = "Erro ao listar por usuário" });
            }
        }

        // Criar chamado
        [HttpPost]
        public IActionResult Create([FromBody] Chamado chamado)
        {
            try
            {
                var criado = _service.Criar(chamado);
                return CreatedAtAction(nameof(GetById), new { id = criado.Id }, criado);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Falha ao criar chamado: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar chamado");
                return StatusCode(500, new { message = "Erro ao criar chamado" });
            }
        }

        // Atualizar chamado
        [HttpPut("{id:guid}")]
        [HttpPatch("{id:guid}")]
        public IActionResult Update(Guid id, [FromBody] Chamado chamado)
        {
            if (id != chamado.Id) return BadRequest(new { message = "Id da rota difere do id do corpo." });

            try
            {
                var chamadoAnterior = _service.ObterPorId(id);
                _service.Atualizar(chamado);
                
                _logger.LogInformation("Chamado {Id} atualizado. Status anterior: {StatusAnterior}, Status novo: {StatusNovo}", 
                    id, chamadoAnterior?.Status, chamado.Status);
                
                // Notificar colaborador se o status mudou
                if (chamadoAnterior != null && chamadoAnterior.Status != chamado.Status)
                {
                    _logger.LogInformation("Status mudou! Criando notificação para usuário {UsuarioId}", chamadoAnterior.UsuarioId);
                    _notificacaoService.NotificarStatusAtualizado(id, chamado.Status.ToString());
                }
                
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar chamado {Id}", id);
                return BadRequest(new { message = ex.Message });
            }
        }

        // Remover chamado
        [HttpDelete("{id:guid}")]
        public IActionResult Delete(Guid id)
        {
            try
            {
                _service.Remover(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao remover chamado {Id}", id);
                return StatusCode(500, new { message = "Erro ao remover chamado" });
            }
        }

        // Atribuir técnico ao chamado
        [HttpPost("{id:guid}/atribuir")]
        public IActionResult Atribuir(Guid id, [FromBody] AtribuirRequest req)
        {
            try
            {
                _service.AtribuirTecnico(id, req.TecnicoId);
                _notificacaoService.NotificarChamadoAtribuido(id, "Técnico");
                return Ok(new { message = "Técnico atribuído com sucesso" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Chamado não encontrado" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atribuir técnico ao chamado {Id}", id);
                return StatusCode(500, new { message = "Erro ao atribuir técnico" });
            }
        }

        // Reabrir chamado
        [HttpPost("{id:guid}/reabrir")]
        public IActionResult Reabrir(Guid id)
        {
            try
            {
                _service.Reabrir(id);
                return Ok(new { message = "Chamado reaberto" });
            }
            catch (KeyNotFoundException)
            {
                return NotFound(new { message = "Chamado não encontrado" });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao reabrir chamado {Id}", id);
                return StatusCode(500, new { message = "Erro ao reabrir chamado" });
            }
        }
    }

    public class AtribuirRequest
    {
        public Guid TecnicoId { get; set; }
    }
}
