using System.Collections.Generic;
using BackendHelpDesk.Models;

namespace BackendHelpDesk.Data
{
    // ContextoFake simula um banco de dados em memória.
    // Quando for integrar com o banco real, basta substituir esta classe por um DbContext do EF.
    public class ContextoFake
    {
        public List<Usuario> Usuarios { get; } = new();
        public List<Chamado> Chamados { get; } = new();
        public List<Comentario> Comentarios { get; } = new();
        public List<Notificacao> Notificacoes { get; } = new();

        public ContextoFake()
        {
            // Dados iniciais de exemplo - facilitam testes locais e documentação.
            Usuarios.Add(new Usuario { Nome = "Administrador", Login = "admin", Senha = "admin123", NivelAcesso = NivelAcesso.Administrador });
            Usuarios.Add(new Usuario { Nome = "Colaborador Exemplo", Login = "colab", Senha = "colab123", NivelAcesso = NivelAcesso.Colaborador });
            Usuarios.Add(new Usuario { Nome = "Técnico Exemplo", Login = "tecnico", Senha = "tecnico123", NivelAcesso = NivelAcesso.Tecnico });

            Chamados.Add(new Chamado { Titulo = "Problema com Impressora", Descricao = "A impressora não responde.", UsuarioId = Usuarios[1].Id, Prioridade = 2 });
            Chamados.Add(new Chamado { Titulo = "Erro no Sistema X", Descricao = "Exceção ao gerar relatório.", UsuarioId = Usuarios[1].Id, Prioridade = 4 });
        }
    }
}
