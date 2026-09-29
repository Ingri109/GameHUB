using System.Threading.Tasks;
using DotNetEnv;
using GameHUB.Data;
using GameHUB.Repositories;
using GameHUB.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using GameHUB.Extensions;

Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddStackExchangeRedisCache(options =>
{
    var baseConn = builder.Configuration.GetConnectionString("Redis") ?? "127.0.0.1:6379,abortConnect=false";
    var config = StackExchange.Redis.ConfigurationOptions.Parse(baseConn);
    config.ConnectTimeout = 500;
    config.SyncTimeout = 500;
    config.ConnectRetry = 1;
    options.ConfigurationOptions = config;
});

builder.Services.AddDbContext<AppDbContext>(options => options.UseNpgsql(Environment.GetEnvironmentVariable("DB_CONNECTION_STRING")));

// Реєстрація репозиторіїв та сервісів 
builder.Services.AddApplicationServices();
builder.Services.AddSingleton<IgdbService>();
builder.Services.AddHostedService<ScheduleCleanupService>();

// Налаштування JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Environment.GetEnvironmentVariable("JWT_SECRET")!)),
            ValidateIssuer = true,
            ValidIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER"),
            ValidateAudience = true,
            ValidAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/api/Notification/stream"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // URL твого Next.js
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials(); // Якщо в майбутньому будуть cookies
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    try
    {
        await db.Database.MigrateAsync();
        Console.WriteLine("✅ БД успішно підключена, міграції актуальні.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Помилка підключення до БД: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy"); 
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();