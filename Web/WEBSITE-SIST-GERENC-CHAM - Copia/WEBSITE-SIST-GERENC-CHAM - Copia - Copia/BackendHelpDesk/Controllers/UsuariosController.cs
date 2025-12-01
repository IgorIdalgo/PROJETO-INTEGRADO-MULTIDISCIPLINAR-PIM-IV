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
        private readonly UsuarioService _service;
        private readonly ILogger<UsuariosController> _logger;

        public UsuariosController(UsuarioService service, ILogger<UsuariosController> logger)
        {
            _service = service;
            _logger = logger;
        }

        // Listar todos os usuários
        [HttpGet]
        public IActionResult GetAll()
        {
            try
            {
                var users = _service.Listar();
                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar usuários");
                return StatusCode(500, new { message = "Erro ao listar usuários" });
            }
        }

        // Obter por id
        [HttpGet("{id:guid}")]
        public IActionResult GetById(Guid id)
        {
            try
            {
                var u = _service.ObterPorId(id);
                if (u == null) return NotFound();
                return Ok(u);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter usuário por id {Id}", id);
                return StatusCode(500, new { message = "Erro ao obter usuário" });
            }
        }

        // Criar novo usuário
        [HttpPost]
        public IActionResult Create([FromBody] Usuario usuario)
        {
            try
            {
                var criado = _service.Criar(usuario);
                return CreatedAtAction(nameof(GetById), new { id = criado.Id }, criado);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Falha ao criar usuário: {Message}", ex.Message);
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar usuário");
                return StatusCode(500, new { message = "Erro ao criar usuário" });
            }
        }

        // Atualizar usuário
        [HttpPut("{id:guid}")]
        public IActionResult Update(Guid id, [FromBody] Usuario usuario)
        {
            if (id != usuario.Id) return BadRequest(new { message = "Id da rota difere do id do corpo." });

            try
            {
                _service.Atualizar(usuario);
                return NoContent();
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar usuário {Id}", id);
                return BadRequest(new { message = ex.Message });
            }
        }

        // Remover usuário
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
                _logger.LogError(ex, "Erro ao remover usuário {Id}", id);
                return StatusCode(500, new { message = "Erro ao remover usuário" });
            }
        }
    }
}
