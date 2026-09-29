using GameHUB.DTOs;

namespace GameHUB.Services;

public interface IFriendshipService
{
    Task SendRequestAsync(Guid currentUserId, Guid targetUserId);
    Task AcceptRequestAsync(Guid currentUserId, Guid requesterId);
    Task RejectRequestAsync(Guid currentUserId, Guid requesterId);
    Task RemoveFriendAsync(Guid currentUserId, Guid friendId);
    Task<IEnumerable<FriendResponseDto>> GetFriendsAsync(Guid userId);
    Task<(IEnumerable<FriendResponseDto> Friends, int TotalCount)> GetFriendsPaginatedAsync(Guid userId, int page, int pageSize);
    Task<(IEnumerable<FriendResponseDto> Incoming, IEnumerable<FriendResponseDto> Outgoing)> GetFriendRequestsAsync(Guid userId);
}