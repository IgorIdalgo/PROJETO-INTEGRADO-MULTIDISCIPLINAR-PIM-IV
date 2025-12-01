using System;

namespace BackendHelpDesk.Models
{
    // Entidade Chamado com campos básicos para um sistema de suporte.
    public class Chamado
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        // Título/assunto do chamado
        public string Titulo { get; set; } = string.Empty;

        // Descrição detalhada do problema
        public string Descricao { get; set; } = string.Empty;

        // Quem abriu o chamado (referência ao Id do usuário)
        public Guid UsuarioId { get; set; }

        // Status atual do chamado
        public StatusChamado Status { get; set; } = StatusChamado.Aberto;

        // Prioridade simples (1..5) - exemplo
        public int Prioridade { get; set; } = 3;

        // Categoria do chamado (ex: hardware, software, rede)
        public string Categoria { get; set; } = "hardware";

        // Técnico atribuído (opcional)
        public Guid? TecnicoId { get; set; }

        // Data de criação
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Data de atualização
        public DateTime? UpdatedAt { get; set; }

        // Data de fechamento
        public DateTime? ClosedAt { get; set; }

        // Sugestões da IA que foram enviadas ao colaborador ao criar o chamado
        public string? SugestaoIAEnviada { get; set; }
    }
}
