using System;
using System.Collections.Generic;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data.Repositories
{
    // Interface do repositório de usuários para possibilitar desacoplamento
    public interface IUsuarioRepository
    {
        IEnumerable<Usuario> Listar();
        Usuario? ObterPorId(Guid id);
        Usuario? ObterPorLogin(string login);
        void Inserir(Usuario usuario);
        void Atualizar(Usuario usuario);
        void Remover(Guid id);
    }
}
