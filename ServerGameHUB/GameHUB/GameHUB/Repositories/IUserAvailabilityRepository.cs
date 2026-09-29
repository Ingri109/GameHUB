using GameHUB.Models;

namespace GameHUB.Repositories;

public interface IUserAvailabilityRepository
{
    Task<List<UserAvailability>> GetByUserIdAsync(Guid userId);
    Task ReplaceAvailabilityAsync(Guid userId, List<UserAvailability> newAvailabilities);
    Task RemoveByDayAsync(Guid userId, int dayOfWeek);
    Task<List<UserAvailability>> GetForUsersAsync(List<Guid> userIds);
}
