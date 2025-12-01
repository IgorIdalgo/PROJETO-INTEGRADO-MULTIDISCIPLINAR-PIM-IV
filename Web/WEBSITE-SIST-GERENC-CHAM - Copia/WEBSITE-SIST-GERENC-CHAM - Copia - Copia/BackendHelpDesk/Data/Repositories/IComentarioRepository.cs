using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data.Repositories
{
    public interface IComentarioRepository
    {
        Task<IEnumerable<Comentario>> GetByChamadoIdAsync(Guid chamadoId);
        Task<Comentario?> GetByIdAsync(Guid id);
        Task<Comentario> CreateAsync(Comentario comentario);
        Task<bool> DeleteAsync(Guid id);
    }
}
