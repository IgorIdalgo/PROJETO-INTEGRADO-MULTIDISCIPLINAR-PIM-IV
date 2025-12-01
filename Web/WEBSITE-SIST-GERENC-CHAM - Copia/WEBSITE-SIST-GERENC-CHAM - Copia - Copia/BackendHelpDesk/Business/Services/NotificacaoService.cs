using System;
using System.Collections.Generic;
using BackendHelpDesk.Data.Repositories;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Business.Services
{
    public class NotificacaoService
    {
        private readonly INotificacaoRepository _repo;
        private readonly IChamadoRepository _chamadoRepo;

        public NotificacaoService(INotificacaoRepository repo, IChamadoRepository chamadoRepo)
        {
            _repo = repo;
            _chamadoRepo = chamadoRepo;
        }

        public IEnumerable<Notificacao> ListarPorUsuario(Guid usuarioId) 
            => _repo.ListarPorUsuario(usuarioId);

        public IEnumerable<Notificacao> ListarNaoLidasPorUsuario(Guid usuarioId) 
            => _repo.ListarNaoLidasPorUsuario(usuarioId);

        public void MarcarComoLida(Guid id) 
            => _repo.MarcarComoLida(id);

        public void MarcarTodasComoLidas(Guid usuarioId) 
            => _repo.MarcarTodasComoLidas(usuarioId);

        // Criar notificação quando comentário é adicionado
        public void NotificarComentarioAdicionado(Guid chamadoId, string nomeAutor)
        {
            var chamado = _chamadoRepo.ObterPorId(chamadoId);
            if (chamado == null)
            {
                Console.WriteLine($"[NOTIFICACAO] Chamado {chamadoId} não encontrado");
                return;
            }

            var notificacao = new Notificacao
            {
                UsuarioId = chamado.UsuarioId,
                Tipo = TipoNotificacao.ComentarioAdicionado,
                Titulo = "Novo comentário no seu chamado",
                Mensagem = $"{nomeAutor} adicionou um comentário no chamado #{chamado.Id.ToString().Substring(0, 8)}",
                ChamadoId = chamadoId,
            };

            Console.WriteLine($"[NOTIFICACAO] Criando notificação de comentário para usuário {chamado.UsuarioId}");
            _repo.Inserir(notificacao);
            Console.WriteLine($"[NOTIFICACAO] Notificação {notificacao.Id} criada com sucesso");
        }

        // Criar notificação quando status é atualizado
        public void NotificarStatusAtualizado(Guid chamadoId, string novoStatus)
        {
            var chamado = _chamadoRepo.ObterPorId(chamadoId);
            if (chamado == null)
            {
                Console.WriteLine($"[NOTIFICACAO] Chamado {chamadoId} não encontrado");
                return;
            }

            var notificacao = new Notificacao
            {
                UsuarioId = chamado.UsuarioId,
                Tipo = TipoNotificacao.StatusAtualizado,
                Titulo = "Status do chamado atualizado",
                Mensagem = $"O chamado #{chamado.Id.ToString().Substring(0, 8)} foi atualizado para: {novoStatus}",
                ChamadoId = chamadoId,
            };

            Console.WriteLine($"[NOTIFICACAO] Criando notificação de status para usuário {chamado.UsuarioId}");
            _repo.Inserir(notificacao);
            Console.WriteLine($"[NOTIFICACAO] Notificação {notificacao.Id} criada com sucesso");
        }

        // Criar notificação quando chamado é atribuído
        public void NotificarChamadoAtribuido(Guid chamadoId, string nomeTecnico)
        {
            var chamado = _chamadoRepo.ObterPorId(chamadoId);
            if (chamado == null) return;

            var notificacao = new Notificacao
            {
                UsuarioId = chamado.UsuarioId,
                Tipo = TipoNotificacao.ChamadoAtribuido,
                Titulo = "Técnico atribuído ao seu chamado",
                Mensagem = $"{nomeTecnico} foi atribuído ao chamado #{chamado.Id.ToString().Substring(0, 8)}",
                ChamadoId = chamadoId,
            };

            _repo.Inserir(notificacao);
        }

        // Criar notificação quando chamado é resolvido
        public void NotificarChamadoResolvido(Guid chamadoId)
        {
            var chamado = _chamadoRepo.ObterPorId(chamadoId);
            if (chamado == null) return;

            var notificacao = new Notificacao
            {
                UsuarioId = chamado.UsuarioId,
                Tipo = TipoNotificacao.ChamadoResolvido,
                Titulo = "Chamado resolvido",
                Mensagem = $"O chamado #{chamado.Id.ToString().Substring(0, 8)} foi marcado como resolvido",
                ChamadoId = chamadoId,
            };

            _repo.Inserir(notificacao);
        }
    }
}
