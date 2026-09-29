using GameHUB.Repositories;
using GameHUB.Services;

namespace GameHUB.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        // Репозиторії
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IFriendshipRepository, FriendshipRepository>();

        // Сервіси
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IFriendshipService, FriendshipService>();
        services.AddScoped<IScheduleService, ScheduleService>();
        
        services.AddSingleton<SseNotificationService>();
        services.AddHttpClient<IAuthService, AuthService>();

        return services;
    }
}
