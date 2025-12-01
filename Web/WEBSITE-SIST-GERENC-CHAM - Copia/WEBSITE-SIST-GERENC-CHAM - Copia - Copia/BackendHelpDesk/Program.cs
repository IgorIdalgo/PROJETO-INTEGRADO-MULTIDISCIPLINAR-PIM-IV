using BackendHelpDesk.Business.Services;
using BackendHelpDesk.Data.Repositories;
using BackendHelpDesk.Data;
using Microsoft.OpenApi.Models;
using Microsoft.AspNetCore.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

// Adicionar controllers
builder.Services.AddControllers();

// CORS: permitir chamadas do frontend em desenvolvimento e produção
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhostDev", policy =>
    {
        policy.WithOrigins(
            "http://localhost:5173",
            "https://localhost:5173",
            "http://localhost:3000",
            "https://localhost:3000"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
    
    // Política mais permissiva para desenvolvimento (comentar em produção)
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Registrar repositórios e serviços como singletons para simular in-memory
builder.Services.AddSingleton<ContextoFake>();
builder.Services.AddSingleton<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddSingleton<IChamadoRepository, ChamadoRepository>();
builder.Services.AddSingleton<IComentarioRepository, ComentarioRepository>();
builder.Services.AddSingleton<INotificacaoRepository, NotificacaoRepository>();
builder.Services.AddSingleton<UsuarioService>();
builder.Services.AddSingleton<ChamadoService>();
builder.Services.AddSingleton<AuthService>();
builder.Services.AddSingleton<NotificacaoService>();

// Swagger para documentacao rápida
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "BackendHelpDesk API", Version = "v1" });
});

var app = builder.Build();

// Middleware de tratamento de exceções global
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        var exceptionHandlerPathFeature = context.Features.Get<IExceptionHandlerPathFeature>();
        if (exceptionHandlerPathFeature?.Error is Exception ex)
        {
            await context.Response.WriteAsJsonAsync(new { error = ex.Message, stackTrace = ex.StackTrace });
        }
    });
});

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BackendHelpDesk v1"));
}
else
{
    app.UseHttpsRedirection();
}

// Habilitar CORS - usar AllowAll durante desenvolvimento
app.UseCors("AllowAll");

app.MapControllers();

app.Run();
