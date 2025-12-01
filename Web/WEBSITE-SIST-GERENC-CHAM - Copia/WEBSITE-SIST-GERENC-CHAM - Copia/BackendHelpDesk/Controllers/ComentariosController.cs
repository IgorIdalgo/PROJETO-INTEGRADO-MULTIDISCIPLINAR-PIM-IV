using Microsoft.AspNetCore.Mvc;
using BackendHelpDesk.Data.Repositories;
using BackendHelpDesk.Models;
using BackendHelpDesk.Business.Services;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace BackendHelpDesk.Api.Controllers
{
    [ApiController]
    [Route("api/chamados/{chamadoId}/comentarios")]
    public class ComentariosController : ControllerBase
    {
        private readonly IComentarioRepository _comentarioRepository;
        private readonly IChamadoRepository _chamadoRepository;
        private readonly IUsuarioRepository _usuarioRepository;
        private readonly NotificacaoService _notificacaoService;
        private readonly ILogger<ComentariosController> _logger;

        public ComentariosController(
            IComentarioRepository comentarioRepository,
            IChamadoRepository chamadoRepository,
            IUsuarioRepository usuarioRepository,
            NotificacaoService notificacaoService,
            ILogger<ComentariosController> logger)
        {
            _comentarioRepository = comentarioRepository;
            _chamadoRepository = chamadoRepository;
            _usuarioRepository = usuarioRepository;
            _notificacaoService = notificacaoService;
            _logger = logger;
        }

        /// <summary>
        /// GET /api/chamados/{chamadoId}/comentarios
        /// Retorna todos os comentários de um chamado
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetComentarios(Guid chamadoId)
        {
            try
            {
                // Verificar se o chamado existe
                var chamado = _chamadoRepository.ObterPorId(chamadoId);
                if (chamado == null)
                {
                    return NotFound(new { message = "Chamado não encontrado." });
                }

                var comentarios = await _comentarioRepository.GetByChamadoIdAsync(chamadoId);
                
                var result = comentarios.Select(c => new
                {
                    id = c.Id,
                    chamadoId = c.ChamadoId,
                    conteudo = c.Conteudo,
                    usuarioId = c.UsuarioId,
                    nomeAutor = c.NomeAutor,
                    publico = c.Publico,
                    createdAt = c.CreatedAt
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao buscar comentários do chamado {ChamadoId}", chamadoId);
                return StatusCode(500, new { message = "Erro interno no servidor." });
            }
        }

        /// <summary>
        /// POST /api/chamados/{chamadoId}/comentarios
        /// Cria um novo comentário em um chamado
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateComentario(Guid chamadoId, [FromBody] CreateComentarioRequest request)
        {
            try
            {
                _logger.LogInformation("Criando comentário para chamado {ChamadoId}", chamadoId);
                _logger.LogInformation("Request: {@Request}", request);

                // Validar request
                if (string.IsNullOrWhiteSpace(request.Conteudo))
                {
                    return BadRequest(new { message = "Conteúdo do comentário é obrigatório." });
                }

                if (request.Id_Autor == Guid.Empty)
                {
                    return BadRequest(new { message = "ID do autor é obrigatório." });
                }

                // Verificar se o chamado existe
                var chamado = _chamadoRepository.ObterPorId(chamadoId);
                if (chamado == null)
                {
                    return NotFound(new { message = "Chamado não encontrado." });
                }

                // Verificar se o usuário existe e obter o nome
                var usuario = _usuarioRepository.ObterPorId(request.Id_Autor);
                if (usuario == null)
                {
                    return BadRequest(new { message = "Usuário não encontrado." });
                }

                // Criar comentário
                var comentario = new Comentario
                {
                    ChamadoId = chamadoId,
                    Conteudo = request.Conteudo,
                    UsuarioId = request.Id_Autor,
                    NomeAutor = usuario.Nome,
                    Publico = request.Publico ?? true,
                    CreatedAt = DateTime.UtcNow
                };

                var created = await _comentarioRepository.CreateAsync(comentario);

                _logger.LogInformation("Comentário criado com sucesso: {ComentarioId}", created.Id);

                // Notificar colaborador se o comentário foi feito por outra pessoa (técnico)
                if (request.Id_Autor != chamado.UsuarioId)
                {
                    _notificacaoService.NotificarComentarioAdicionado(chamadoId, usuario.Nome);
                }

                return CreatedAtAction(
                    nameof(GetComentarios),
                    new { chamadoId = chamadoId },
                    new
                    {
                        id = created.Id,
                        chamadoId = created.ChamadoId,
                        conteudo = created.Conteudo,
                        usuarioId = created.UsuarioId,
                        nomeAutor = created.NomeAutor,
                        publico = created.Publico,
                        createdAt = created.CreatedAt
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar comentário para chamado {ChamadoId}", chamadoId);
                return StatusCode(500, new { message = "Erro interno no servidor.", detail = ex.Message });
            }
        }

        /// <summary>
        /// DELETE /api/chamados/{chamadoId}/comentarios/{comentarioId}
        /// Remove um comentário
        /// </summary>
        [HttpDelete("{comentarioId}")]
        public async Task<IActionResult> DeleteComentario(Guid chamadoId, Guid comentarioId)
        {
            try
            {
                var comentario = await _comentarioRepository.GetByIdAsync(comentarioId);
                
                if (comentario == null)
                {
                    return NotFound(new { message = "Comentário não encontrado." });
                }

                if (comentario.ChamadoId != chamadoId)
                {
                    return BadRequest(new { message = "Comentário não pertence a este chamado." });
                }

                var deleted = await _comentarioRepository.DeleteAsync(comentarioId);
                
                if (!deleted)
                {
                    return NotFound(new { message = "Comentário não encontrado." });
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao deletar comentário {ComentarioId}", comentarioId);
                return StatusCode(500, new { message = "Erro interno no servidor." });
            }
        }

        // DTO para criação de comentário
        public class CreateComentarioRequest
        {
            public string Conteudo { get; set; } = string.Empty;
            public Guid Id_Autor { get; set; }
            public bool? Publico { get; set; }
        }
    }
}
