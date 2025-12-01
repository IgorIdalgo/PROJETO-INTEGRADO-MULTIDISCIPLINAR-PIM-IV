using System;
using System.Collections.Generic;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data.Repositories
{
    public interface INotificacaoRepository
    {
        IEnumerable<Notificacao> Listar();
        IEnumerable<Notificacao> ListarPorUsuario(Guid usuarioId);
        IEnumerable<Notificacao> ListarNaoLidasPorUsuario(Guid usuarioId);
        Notificacao? ObterPorId(Guid id);
        void Inserir(Notificacao notificacao);
        void Atualizar(Notificacao notificacao);
        void MarcarComoLida(Guid id);
        void MarcarTodasComoLidas(Guid usuarioId);
        void Remover(Guid id);
    }
}
