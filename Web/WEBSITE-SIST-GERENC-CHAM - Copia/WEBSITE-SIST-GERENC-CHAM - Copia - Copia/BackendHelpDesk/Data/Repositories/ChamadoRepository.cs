using System;
using System.Collections.Generic;
using System.Linq;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data.Repositories
{
    public class ChamadoRepository : IChamadoRepository
    {
        private readonly ContextoFake _ctx;

        public ChamadoRepository(ContextoFake ctx)
        {
            _ctx = ctx;
        }

        public IEnumerable<Chamado> Listar()
        {
            return _ctx.Chamados;
        }

        public Chamado? ObterPorId(Guid id)
        {
            return _ctx.Chamados.FirstOrDefault(c => c.Id == id);
        }

        public IEnumerable<Chamado> ListarPorUsuario(Guid usuarioId)
        {
            return _ctx.Chamados.Where(c => c.UsuarioId == usuarioId);
        }

        public void Inserir(Chamado chamado)
        {
            _ctx.Chamados.Add(chamado);
        }

        public void Atualizar(Chamado chamado)
        {
            var idx = _ctx.Chamados.FindIndex(c => c.Id == chamado.Id);
            if (idx >= 0) _ctx.Chamados[idx] = chamado;
        }

        public void Remover(Guid id)
        {
            var c = ObterPorId(id);
            if (c != null) _ctx.Chamados.Remove(c);
        }
    }
}
