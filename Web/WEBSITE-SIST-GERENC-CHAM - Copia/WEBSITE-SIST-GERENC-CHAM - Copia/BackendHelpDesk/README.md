# BackendHelpDesk (simulado) - .NET 8

Projeto backend em C# (ASP.NET Core) com estrutura em camadas, usando armazenamento em memória (ContextoFake).
Feito conforme solicitado: **sem integração com banco de dados** e **sem JWT**. Código comentado em português para rastreabilidade.

## Como executar

1. Abra o terminal na pasta `BackendHelpDesk` (onde está o `.csproj`).
2. Execute `dotnet restore` e depois `dotnet run`.
3. A API ficará disponível em `https://localhost:5001` (ou porta dinâmica).
4. A documentação Swagger estará em `/swagger`.

## Observações

- Para integrar com o banco real, substitua `ContextoFake` por um `DbContext` do Entity Framework e ajuste os repositórios.
- Nunca armazene senhas em texto simples em produção; use hashing (BCrypt, Argon2, etc.).
