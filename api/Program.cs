using System.Security.Claims;
using System.Text;
using InternLinkApi.Data;
using DotNetEnv;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Implementation;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.EmailSender;
using InternLinkApi.Services.JobService;
using InternLinkApi.Services.ProfileService;
using InternLinkApi.Services.ResumeService;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QuestPDF.Infrastructure;

// Configure QuestPDF Community license for academic and open source use
QuestPDF.Settings.License = LicenseType.Community;

Env.Load(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"));

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("SupabaseDb")
    ?? throw new InvalidOperationException(
        "Connection string 'SupabaseDb' not found. "
        + "Set the ConnectionStrings__SupabaseDb environment variable "
        + "or add it to appsettings.json under ConnectionStrings:SupabaseDb.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddIdentity<User, Role>(options =>
    {
        options.Password.RequiredLength = 8;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireNonAlphanumeric = true;
        options.Password.RequireLowercase = false;

        options.SignIn.RequireConfirmedEmail = true;

        options.Lockout.MaxFailedAccessAttempts = 5;
        options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
        options.Lockout.AllowedForNewUsers = true;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

var jwtSecret = builder.Configuration["Jwt:Secret"]
    ?? builder.Configuration["JWT_SECRET"]
    ?? Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? throw new InvalidOperationException("JWT secret is not configured. Set Jwt:Secret or the JWT_SECRET environment variable.");
var jwtKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "InternLinkApi",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "InternLinkWeb",
            IssuerSigningKey = jwtKey,
            ClockSkew = TimeSpan.Zero,
            RoleClaimType = ClaimTypes.Role,
        };
    });

builder.Services.AddAuthorizationBuilder()
    .AddPolicy("StudentOnly", p => p.RequireRole("Student"))
    .AddPolicy("CompanyOnly", p => p.RequireRole("Company"))
    .AddPolicy("AdminOnly", p => p.RequireRole("Admin"))
    .AddPolicy("CounselorOnly", p => p.RequireRole("Counselor"));

if (builder.Environment.IsDevelopment())
{
    builder.Services.AddSingleton<IEmailSender, DevEmailSender>();
}
else
{
    builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
}

// ── Repositories ─────────────────────────────────────────────────────
// Scoped to match DbContext lifetime. SaveChangesAsync is left to the caller
// (service layer) so that operations spanning multiple repositories can be
// wrapped in a single transaction.
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IJobRepository, JobRepository>();
builder.Services.AddScoped<IApplicationRepository, ApplicationRepository>();
builder.Services.AddScoped<IStudentRepository, StudentRepository>();
builder.Services.AddScoped<IResumeRepository, ResumeRepository>();

// ── Services ─────────────────────────────────────────────────────────
builder.Services.AddScoped<IJobService, JobService>();
builder.Services.AddScoped<ISupabaseStorageService, SupabaseStorageService>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<IResumeService, ResumeService>();

// ── CORS ─────────────────────────────────────────────────────────────
var allowedOrigins = (builder.Configuration["Cors:AllowedOrigins"]
    ?? "http://localhost:3000")
    .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy
            .WithOrigins(allowedOrigins)
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials()
            .SetIsOriginAllowed(origin =>
            {
                // Allow explicit configured origins
                if (allowedOrigins.Any(o =>
                    o.Equals(origin, StringComparison.OrdinalIgnoreCase)))
                    return true;

                // Allow Vercel preview deployments: <project>-<hash>.vercel.app
                if (origin.EndsWith(".vercel.app", StringComparison.OrdinalIgnoreCase))
                    return true;

                return false;
            });
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

    try
    {
        await db.Database.MigrateAsync();
        Console.WriteLine("INFO: Migrations applied successfully.");

        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<User>>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<Role>>();
        await DbSeeder.SeedAsync(db, userManager, roleManager);
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine(
            $"WARNING: Database migration or seeding failed on startup. "
            + $"{ex.GetType().Name}: {ex.Message}");
    }
}

app.UseHttpsRedirection();

// ── Security headers ─────────────────────────────────────────────────
app.Use(async (context, next) =>
{
    context.Response.Headers["X-Content-Type-Options"] = "nosniff";
    context.Response.Headers["X-Frame-Options"] = "DENY";
    context.Response.Headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

    if (!context.Request.IsHttps)
    {
        // Don't set HSTS on plain HTTP (would break local dev)
        await next();
        return;
    }
    context.Response.Headers["Strict-Transport-Security"] =
        "max-age=31536000; includeSubDomains";
    await next();
});

app.UseCors("FrontendPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
