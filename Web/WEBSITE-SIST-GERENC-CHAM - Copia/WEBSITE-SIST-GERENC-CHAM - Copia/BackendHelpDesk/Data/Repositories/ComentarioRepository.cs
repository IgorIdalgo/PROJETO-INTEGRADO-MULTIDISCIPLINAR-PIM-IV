using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data.Repositories
{
    public class ComentarioRepository : IComentarioRepository
    {
        private readonly ContextoFake _contexto;

        public ComentarioRepository(ContextoFake contexto)
        {
            _contexto = contexto;
        }

        public Task<IEnumerable<Comentario>> GetByChamadoIdAsync(Guid chamadoId)
        {
            var comentarios = _contexto.Comentarios
                .Where(c => c.ChamadoId == chamadoId)
                .OrderBy(c => c.CreatedAt)
                .ToList();
            
            return Task.FromResult<IEnumerable<Comentario>>(comentarios);
        }

        public Task<Comentario?> GetByIdAsync(Guid id)
        {
            var comentario = _contexto.Comentarios.FirstOrDefault(c => c.Id == id);
            return Task.FromResult(comentario);
        }

        public Task<Comentario> CreateAsync(Comentario comentario)
        {
            comentario.Id = Guid.NewGuid();
            comentario.CreatedAt = DateTime.UtcNow;
            
            _contexto.Comentarios.Add(comentario);
            
            return Task.FromResult(comentario);
        }

        public Task<bool> DeleteAsync(Guid id)
        {
            var comentario = _contexto.Comentarios.FirstOrDefault(c => c.Id == id);
            if (comentario == null)
                return Task.FromResult(false);
            
            _contexto.Comentarios.Remove(comentario);
            return Task.FromResult(true);
        }
    }
}
