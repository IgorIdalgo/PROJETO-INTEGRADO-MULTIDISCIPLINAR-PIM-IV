using System;
using System.Collections.Generic;
using System.Linq;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data.Repositories
{
    public class NotificacaoRepository : INotificacaoRepository
    {
        private readonly ContextoFake _ctx;

        public NotificacaoRepository(ContextoFake ctx)
        {
            _ctx = ctx;
        }

        public IEnumerable<Notificacao> Listar() => _ctx.Notificacoes;

        public IEnumerable<Notificacao> ListarPorUsuario(Guid usuarioId) 
            => _ctx.Notificacoes.Where(n => n.UsuarioId == usuarioId).OrderByDescending(n => n.CreatedAt);

        public IEnumerable<Notificacao> ListarNaoLidasPorUsuario(Guid usuarioId) 
            => _ctx.Notificacoes.Where(n => n.UsuarioId == usuarioId && !n.Lida).OrderByDescending(n => n.CreatedAt);

        public Notificacao? ObterPorId(Guid id) 
            => _ctx.Notificacoes.FirstOrDefault(n => n.Id == id);

        public void Inserir(Notificacao notificacao)
        {
            _ctx.Notificacoes.Add(notificacao);
        }

        public void Atualizar(Notificacao notificacao)
        {
            var existente = _ctx.Notificacoes.FirstOrDefault(n => n.Id == notificacao.Id);
            if (existente != null)
            {
                _ctx.Notificacoes.Remove(existente);
                _ctx.Notificacoes.Add(notificacao);
            }
        }

        public void MarcarComoLida(Guid id)
        {
            var notificacao = ObterPorId(id);
            if (notificacao != null)
            {
                notificacao.Lida = true;
                Atualizar(notificacao);
            }
        }

        public void MarcarTodasComoLidas(Guid usuarioId)
        {
            var notificacoes = ListarNaoLidasPorUsuario(usuarioId);
            foreach (var notificacao in notificacoes)
            {
                notificacao.Lida = true;
                Atualizar(notificacao);
            }
        }

        public void Remover(Guid id)
        {
            var notificacao = ObterPorId(id);
            if (notificacao != null)
            {
                _ctx.Notificacoes.Remove(notificacao);
            }
        }
    }
}
