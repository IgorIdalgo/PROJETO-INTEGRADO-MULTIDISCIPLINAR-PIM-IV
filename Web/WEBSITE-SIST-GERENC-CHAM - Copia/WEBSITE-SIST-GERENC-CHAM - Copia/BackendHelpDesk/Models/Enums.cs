namespace BackendHelpDesk.Models
{
    // Enums utilizados no projeto
    public enum NivelAcesso
    {
        Colaborador = 0,
        Administrador = 1,
        Tecnico = 2
    }

    public enum StatusChamado
    {
        Aberto = 0,
        EmAtendimento = 1,
        Resolvido = 2,
        Fechado = 3
    }
}
