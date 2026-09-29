using GameHUB.Models;

namespace GameHUB.Repositories;

public interface IUserRepository
{
    Task<User?> GetByDiscordIdAsync(string discordId);
    Task<User> CreateAsync(User user);
    Task<User?> GetByIdAsync(Guid id);
    Task<User?> GetUserProfileAsync(Guid id);
    Task UpdateAsync(User user);
}
