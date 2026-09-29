using GameHUB.Data;
using GameHUB.Models;
using Microsoft.EntityFrameworkCore;

namespace GameHUB.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByDiscordIdAsync(string discordId)
    {
        return await _context.Users.FirstOrDefaultAsync(u => u.DiscordId == discordId);
    }

    public async Task<User> CreateAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }
    
    public async Task<User?> GetByIdAsync(Guid id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetUserProfileAsync(Guid id)
    {
        return await _context.Users
            .AsNoTracking()
            .Include(u => u.Tiers)
                .ThenInclude(t => t.Game)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }
}
