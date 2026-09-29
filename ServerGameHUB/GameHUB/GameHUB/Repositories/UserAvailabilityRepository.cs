using GameHUB.Data;
using GameHUB.Models;
using Microsoft.EntityFrameworkCore;

namespace GameHUB.Repositories;

public class UserAvailabilityRepository : IUserAvailabilityRepository
{
    private readonly AppDbContext _context;

    public UserAvailabilityRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserAvailability>> GetByUserIdAsync(Guid userId)
    {
        return await _context.UserAvailabilities
            .Where(ua => ua.UserId == userId)
            .OrderBy(ua => ua.DayOfWeek)
            .ToListAsync();
    }

    public async Task ReplaceAvailabilityAsync(Guid userId, List<UserAvailability> newAvailabilities)
    {
        // Знаходимо всі існуючі записи цього користувача
        var existing = await _context.UserAvailabilities
            .Where(ua => ua.UserId == userId)
            .ToListAsync();

        // Видаляємо старі та додаємо нові в межах одного збереження (транзакції)
        _context.UserAvailabilities.RemoveRange(existing);
        await _context.UserAvailabilities.AddRangeAsync(newAvailabilities);
        await _context.SaveChangesAsync();
    }
    
    public async Task RemoveByDayAsync(Guid userId, int dayOfWeek)
    {
        var existing = await _context.UserAvailabilities
            .FirstOrDefaultAsync(ua => ua.UserId == userId && ua.DayOfWeek == dayOfWeek);
        
        if (existing != null)
        {
            _context.UserAvailabilities.Remove(existing);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<List<UserAvailability>> GetForUsersAsync(List<Guid> userIds)
    {
        return await _context.UserAvailabilities
            .Include(ua => ua.User) // Підтягуємо дані користувача (Username, Avatar)
            .Where(ua => userIds.Contains(ua.UserId))
            .OrderBy(ua => ua.UserId)
            .ThenBy(ua => ua.DayOfWeek)
            .ToListAsync();
    }
}