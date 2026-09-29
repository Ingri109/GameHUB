using GameHUB.DTOs;
using GameHUB.Models;
using GameHUB.Repositories;

namespace GameHUB.Services;

public class FriendshipService : IFriendshipService
{
    private readonly IFriendshipRepository _friendshipRepository;
    private readonly IUserRepository _userRepository;

    public FriendshipService(IFriendshipRepository friendshipRepository, IUserRepository userRepository)
    {
        _friendshipRepository = friendshipRepository;
        _userRepository = userRepository;
    }

    public async Task SendRequestAsync(Guid currentUserId, Guid targetUserId)
    {
        if (currentUserId == targetUserId)
            throw new Exception("Не можна додати себе в друзі.");

        var targetUser = await _userRepository.GetByIdAsync(targetUserId) 
            ?? throw new Exception("Користувача не знайдено.");

        var existing = await _friendshipRepository.GetFriendshipAsync(currentUserId, targetUserId);
        if (existing != null)
            throw new Exception("Запит вже існує або ви вже друзі.");

        var friendship = new Friendship
        {
            RequesterId = currentUserId,
            AddresseeId = targetUserId,
            Status = "PENDING"
        };

        await _friendshipRepository.CreateAsync(friendship);
    }

    public async Task AcceptRequestAsync(Guid currentUserId, Guid requesterId)
    {
        var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, requesterId)
            ?? throw new Exception("Запит не знайдено.");

        if (friendship.AddresseeId != currentUserId)
            throw new Exception("Ви не можете прийняти цей запит.");

        friendship.Status = "ACCEPTED";
        await _friendshipRepository.UpdateAsync(friendship);
    }

    
    public async Task RejectRequestAsync(Guid currentUserId, Guid requesterId)
    {
        var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, requesterId)
            ?? throw new Exception("Запит не знайдено.");

        // If it's a pending request the current user received
        if (friendship.AddresseeId == currentUserId && friendship.Status == "PENDING")
        {
            await _friendshipRepository.RemoveFriendshipAsync(friendship);
            return;
        }
        
        // If it's a pending request the current user sent (cancel request)
        if (friendship.RequesterId == currentUserId && friendship.Status == "PENDING")
        {
            await _friendshipRepository.RemoveFriendshipAsync(friendship);
            return;
        }

        throw new Exception("Не можна відхилити/скасувати цей запит.");
    }

    public async Task RemoveFriendAsync(Guid currentUserId, Guid friendId)
    {
        var friendship = await _friendshipRepository.GetFriendshipAsync(currentUserId, friendId)
            ?? throw new Exception("Дружбу не знайдено.");

        await _friendshipRepository.RemoveFriendshipAsync(friendship);
    }

    public async Task<(IEnumerable<FriendResponseDto> Friends, int TotalCount)> GetFriendsPaginatedAsync(Guid userId, int page, int pageSize)
    {
        return await _friendshipRepository.GetUserFriendsPaginatedAsync(userId, page, pageSize);
    }

    public async Task<(IEnumerable<FriendResponseDto> Incoming, IEnumerable<FriendResponseDto> Outgoing)> GetFriendRequestsAsync(Guid userId)
    {
        var (incoming, outgoing) = await _friendshipRepository.GetFriendRequestsAsync(userId);
        
        var incomingDtos = incoming.Select(f => new FriendResponseDto
        {
            UserId = f.Requester!.Id,
            Username = f.Requester.Username,
            DisplayName = f.Requester.DisplayName,
            DiscordNickname = f.Requester.Username,
            AvatarUrl = f.Requester.AvatarUrl,
            Status = f.Status
        });

        var outgoingDtos = outgoing.Select(f => new FriendResponseDto
        {
            UserId = f.Addressee!.Id,
            Username = f.Addressee.Username,
            DisplayName = f.Addressee.DisplayName,
            DiscordNickname = f.Addressee.Username,
            AvatarUrl = f.Addressee.AvatarUrl,
            Status = f.Status
        });
        
        return (incomingDtos, outgoingDtos);
    }

    public async Task<IEnumerable<FriendResponseDto>> GetFriendsAsync(Guid userId)
    {
        var friendships = await _friendshipRepository.GetUserFriendshipsAsync(userId);
        
        return friendships
            .GroupBy(f => f.UserId)
            .Select(g => g.First());
    }
}