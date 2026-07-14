using InternLinkApi.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("SupabaseDb")
    ?? throw new InvalidOperationException(
        "Connection string 'SupabaseDb' not found. "
        + "Set the ConnectionStrings__SupabaseDb environment variable "
        + "or add it to appsettings.json under ConnectionStrings:SupabaseDb.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
        npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 3)));

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        var canConnect = await db.Database.CanConnectAsync();
        if (!canConnect)
        {
            Console.Error.WriteLine(
                "ERROR: ApplicationDbContext cannot connect to the database. "
                + $"{nameof(db.Database.CanConnectAsync)} returned false. "
                + "Check that: (1) the database server is running, "
                + "(2) the connection string in ConnectionStrings:SupabaseDb is correct, "
                + "and (3) firewall rules allow the connection.");
        }
        else
        {
            Console.WriteLine("INFO: Database connection verified successfully.");
        }
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine(
            $"ERROR: Failed to connect to the database. Connection string: "
            + $"Host={new Npgsql.NpgsqlConnectionStringBuilder(connectionString).Host};"
            + $"Database={new Npgsql.NpgsqlConnectionStringBuilder(connectionString).Database}"
            + $" — {ex.GetType().Name}: {ex.Message}");
        throw;
    }
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
