using System;

namespace BackendHelpDesk.Models
{
    // Entidade Usuario com comentários em português para rastreabilidade.
    public class Usuario
    {
        // Identificador único
        public Guid Id { get; set; } = Guid.NewGuid();

        // Nome completo do usuário
        public string Nome { get; set; } = string.Empty;

        // Login (pode ser email ou usuário)
        public string Login { get; set; } = string.Empty;

        // Senha em texto simples para simulação (NUNCA fazer isso em produção)
        public string Senha { get; set; } = string.Empty;

        // Nível de acesso do usuário
        public NivelAcesso NivelAcesso { get; set; } = NivelAcesso.Colaborador;

        // Data de criação do registro
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Data de atualização (opcional)
        public DateTime? UpdatedAt { get; set; }
    }
}
