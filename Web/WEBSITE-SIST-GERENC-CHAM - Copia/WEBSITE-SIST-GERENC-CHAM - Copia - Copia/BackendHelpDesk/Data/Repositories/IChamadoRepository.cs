using System;
using System.Collections.Generic;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data.Repositories
{
    public interface IChamadoRepository
    {
        IEnumerable<Chamado> Listar();
        Chamado? ObterPorId(Guid id);
        IEnumerable<Chamado> ListarPorUsuario(Guid usuarioId);
        void Inserir(Chamado chamado);
        void Atualizar(Chamado chamado);
        void Remover(Guid id);
    }
}
