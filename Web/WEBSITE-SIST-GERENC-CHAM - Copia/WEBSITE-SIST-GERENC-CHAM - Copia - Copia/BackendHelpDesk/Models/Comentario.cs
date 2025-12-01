using System;

namespace BackendHelpDesk.Models
{
    /// <summary>
    /// Entidade Comentário para registrar atualizações e mensagens em um chamado
    /// </summary>
    public class Comentario
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// ID do chamado ao qual este comentário pertence
        /// </summary>
        public Guid ChamadoId { get; set; }

        /// <summary>
        /// Conteúdo do comentário
        /// </summary>
        public string Conteudo { get; set; } = string.Empty;

        /// <summary>
        /// ID do usuário que criou o comentário
        /// </summary>
        public Guid UsuarioId { get; set; }

        /// <summary>
        /// Nome do autor (desnormalizado para performance)
        /// </summary>
        public string NomeAutor { get; set; } = string.Empty;

        /// <summary>
        /// Se true, visível para todos; se false, apenas equipe interna
        /// </summary>
        public bool Publico { get; set; } = true;

        /// <summary>
        /// Data de criação do comentário
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
