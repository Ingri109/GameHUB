using GameHUB.DTOs;

namespace GameHUB.Services;

public interface IUserService
{
    Task<UserProfileDetailDto?> GetUserProfileAsync(Guid userId, Guid requestorId);

    Task<GlobalContextDto?> GetGlobalContextAsync(Guid userId);
    Task<UserProfileAggregateDto?> GetUserProfileAggregateAsync(string username, Guid requestorId);

}
