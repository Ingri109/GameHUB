using GameHUB.DTOs;

namespace GameHUB.Services;

public interface IScheduleService
{
    Task<UserScheduleResponse> GetUserScheduleAsync(Guid userId);
    Task<List<UserScheduleResponse>> GetFriendsSchedulesAsync(Guid userId);
    Task UpdateScheduleAsync(Guid userId, UpdateScheduleRequest request);
}
