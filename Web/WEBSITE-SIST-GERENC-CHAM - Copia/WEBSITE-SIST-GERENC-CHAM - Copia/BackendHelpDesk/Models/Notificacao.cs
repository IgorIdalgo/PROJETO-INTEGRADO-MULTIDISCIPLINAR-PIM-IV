using System;

namespace BackendHelpDesk.Models
{
    // Entidade para notificações de usuários
    public class Notificacao
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // Usuário que receberá a notificação
        public Guid UsuarioId { get; set; }

        // Tipo de notificação
        public TipoNotificacao Tipo { get; set; }

        // Título da notificação
        public string Titulo { get; set; } = string.Empty;

        // Mensagem da notificação
        public string Mensagem { get; set; } = string.Empty;

        // Chamado relacionado (opcional)
        public Guid? ChamadoId { get; set; }

        // Se foi lida
        public bool Lida { get; set; } = false;

        // Data de criação
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum TipoNotificacao
    {
        ComentarioAdicionado,
        StatusAtualizado,
        ChamadoAtribuido,
        ChamadoResolvido,
        ChamadoReaberto
    }
}
