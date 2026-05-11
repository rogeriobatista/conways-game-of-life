using ConwayGameOfLife.Api.ExceptionHandling;
using ConwayGameOfLife.Application;
using ConwayGameOfLife.Infrastructure;
using ConwayGameOfLife.Infrastructure.Persistence;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Conway's Game of Life API",
        Version = "v1",
        Description =
            "REST API for Conway's Game of Life with SQLite persistence. A stable final state is a generation that "
            + "does not change after one evolution step (still lifes). Oscillators typically yield 400 when "
            + "maxAttempts is exceeded."
    });
});

builder.Services.AddApplication(builder.Configuration);
builder.Services.AddInfrastructure(builder.Configuration);

builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddFluentValidationAutoValidation();

var app = builder.Build();

await using (var scope = app.Services.CreateAsyncScope())
{
    var db = scope.ServiceProvider.GetRequiredService<GameDbContext>();
    await db.Database.MigrateAsync().ConfigureAwait(false);
}

app.UseExceptionHandler();
app.UseSwagger();
app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "Conway Game of Life v1");
});

app.MapControllers();
app.Run();
