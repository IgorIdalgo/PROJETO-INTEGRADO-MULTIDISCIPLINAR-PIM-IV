using System;
using System.Collections.Generic;
using BackendHelpDesk.Data.Repositories;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Business.Services
{
    // Serviço de Chamados: regras de negócio para manipular chamados.
    public class ChamadoService
    {
        private readonly IChamadoRepository _repo;
        private readonly IUsuarioRepository _usuarioRepo;

        public ChamadoService(IChamadoRepository repo, IUsuarioRepository usuarioRepo)
        {
            _repo = repo;
            _usuarioRepo = usuarioRepo;
        }

        public IEnumerable<Chamado> Listar() => _repo.Listar();

        public Chamado? ObterPorId(Guid id) => _repo.ObterPorId(id);

        public IEnumerable<Chamado> ListarPorUsuario(Guid usuarioId) => _repo.ListarPorUsuario(usuarioId);

        public Chamado Criar(Chamado chamado)
        {
            // Validação: usuário existe
            var user = _usuarioRepo.ObterPorId(chamado.UsuarioId);
            if (user == null) throw new InvalidOperationException("Usuário não existe para abrir o chamado.");

            chamado.Id = Guid.NewGuid();
            chamado.CreatedAt = DateTime.UtcNow;
            _repo.Inserir(chamado);
            return chamado;
        }

        public void Atualizar(Chamado chamado)
        {
            var existente = _repo.ObterPorId(chamado.Id);
            if (existente == null) throw new KeyNotFoundException("Chamado não encontrado.");

            chamado.UpdatedAt = DateTime.UtcNow;
            _repo.Atualizar(chamado);
        }

        public void AtribuirTecnico(Guid chamadoId, Guid tecnicoId)
        {
            var chamado = _repo.ObterPorId(chamadoId);
            if (chamado == null) throw new KeyNotFoundException("Chamado não encontrado.");

            var tecnico = _usuarioRepo.ObterPorId(tecnicoId);
            if (tecnico == null) throw new InvalidOperationException("Técnico não encontrado.");

            chamado.TecnicoId = tecnicoId;
            chamado.UpdatedAt = DateTime.UtcNow;
            _repo.Atualizar(chamado);
        }

        public void Reabrir(Guid chamadoId)
        {
            var chamado = _repo.ObterPorId(chamadoId);
            if (chamado == null) throw new KeyNotFoundException("Chamado não encontrado.");

            if (chamado.Status != StatusChamado.Resolvido && chamado.Status != StatusChamado.Fechado)
                throw new InvalidOperationException("Apenas chamados resolvidos ou fechados podem ser reabertos.");

            chamado.Status = StatusChamado.Aberto;
            chamado.UpdatedAt = DateTime.UtcNow;
            _repo.Atualizar(chamado);
        }

        public void Remover(Guid id) => _repo.Remover(id);
    }
}
