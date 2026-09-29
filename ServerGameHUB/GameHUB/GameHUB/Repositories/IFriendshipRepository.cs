using GameHUB.Models;
using GameHUB.DTOs;

namespace GameHUB.Repositories;

public interface IFriendshipRepository
{
    Task<Friendship?> GetFriendshipAsync(Guid userId1, Guid userId2);
    Task CreateAsync(Friendship friendship);
    Task UpdateAsync(Friendship friendship);
    Task<IEnumerable<FriendResponseDto>> GetUserFriendshipsAsync(Guid userId);
    Task<(IEnumerable<FriendResponseDto> friendships, int totalCount)> GetUserFriendsPaginatedAsync(Guid userId, int page, int pageSize);
    Task<(IEnumerable<Friendship> incoming, IEnumerable<Friendship> outgoing)> GetFriendRequestsAsync(Guid userId);
    Task RemoveFriendshipAsync(Friendship friendship);
}