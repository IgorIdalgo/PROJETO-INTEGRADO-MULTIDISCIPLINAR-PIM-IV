using System;
using System.Collections.Generic;
using System.Linq;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data.Repositories
{
    // Implementação simples do repositório usando ContextoFake
    public class UsuarioRepository : IUsuarioRepository
    {
        private readonly ContextoFake _ctx;

        public UsuarioRepository(ContextoFake ctx)
        {
            _ctx = ctx;
        }

        public IEnumerable<Usuario> Listar()
        {
            return _ctx.Usuarios;
        }

        public Usuario? ObterPorId(Guid id)
        {
            return _ctx.Usuarios.FirstOrDefault(u => u.Id == id);
        }

        public Usuario? ObterPorLogin(string login)
        {
            return _ctx.Usuarios.FirstOrDefault(u => u.Login.Equals(login, StringComparison.OrdinalIgnoreCase));
        }

        public void Inserir(Usuario usuario)
        {
            _ctx.Usuarios.Add(usuario);
        }

        public void Atualizar(Usuario usuario)
        {
            var idx = _ctx.Usuarios.FindIndex(u => u.Id == usuario.Id);
            if (idx >= 0) _ctx.Usuarios[idx] = usuario;
        }

        public void Remover(Guid id)
        {
            var u = ObterPorId(id);
            if (u != null) _ctx.Usuarios.Remove(u);
        }
    }
}
