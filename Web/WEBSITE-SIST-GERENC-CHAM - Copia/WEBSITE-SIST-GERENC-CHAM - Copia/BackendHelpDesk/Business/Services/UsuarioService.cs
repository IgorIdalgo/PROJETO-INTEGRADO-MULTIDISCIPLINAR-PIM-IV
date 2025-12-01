using System;
using System.Collections.Generic;
using BackendHelpDesk.Data.Repositories;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Business.Services
{
    // Serviço de usuário: contém regras de negócio e validações simples.
    public class UsuarioService
    {
        private readonly IUsuarioRepository _repo;

        public UsuarioService(IUsuarioRepository repo)
        {
            _repo = repo;
        }

        // Listar todos os usuários
        public IEnumerable<Usuario> Listar() => _repo.Listar();

        // Obter por id
        public Usuario? ObterPorId(Guid id) => _repo.ObterPorId(id);

        // Criar novo usuário (validações mínimas)
        public Usuario Criar(Usuario usuario)
        {
            // Exemplo de validação: login único
            var existente = _repo.ObterPorLogin(usuario.Login);
            if (existente != null) throw new InvalidOperationException("Login já existe.");

            usuario.Id = Guid.NewGuid();
            usuario.CreatedAt = DateTime.UtcNow;
            _repo.Inserir(usuario);
            return usuario;
        }

        // Atualizar usuário
        public void Atualizar(Usuario usuario)
        {
            var existente = _repo.ObterPorId(usuario.Id);
            if (existente == null) throw new KeyNotFoundException("Usuário não encontrado.");

            usuario.UpdatedAt = DateTime.UtcNow;
            _repo.Atualizar(usuario);
        }

        // Remover usuário
        public void Remover(Guid id)
        {
            _repo.Remover(id);
        }
    }
}
