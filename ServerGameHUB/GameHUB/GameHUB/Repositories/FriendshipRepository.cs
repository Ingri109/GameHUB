using GameHUB.Data;
using GameHUB.Models;
using Microsoft.EntityFrameworkCore;
using GameHUB.DTOs;

namespace GameHUB.Repositories;

public class FriendshipRepository : IFriendshipRepository
{
    private readonly AppDbContext _context;

    public FriendshipRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Friendship?> GetFriendshipAsync(Guid userId1, Guid userId2)
    {
        return await _context.Friendships
            .FirstOrDefaultAsync(f => 
                (f.RequesterId == userId1 && f.AddresseeId == userId2) ||
                (f.RequesterId == userId2 && f.AddresseeId == userId1));
    }

    public async Task CreateAsync(Friendship friendship)
    {
        await _context.Friendships.AddAsync(friendship);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Friendship friendship)
    {
        _context.Friendships.Update(friendship);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<FriendResponseDto>> GetUserFriendshipsAsync(Guid userId)
    {
        return await _context.Friendships
            .AsNoTracking()
            .Where(f => f.RequesterId == userId || f.AddresseeId == userId)
            .Select(f => new FriendResponseDto
            {
                UserId = f.RequesterId == userId ? f.AddresseeId : f.RequesterId,
                Username = f.RequesterId == userId ? f.Addressee!.Username : f.Requester!.Username,
                DisplayName = f.RequesterId == userId ? f.Addressee!.DisplayName : f.Requester!.DisplayName,
                DiscordNickname = f.RequesterId == userId ? f.Addressee!.Username : f.Requester!.Username,
                AvatarUrl = f.RequesterId == userId ? f.Addressee!.AvatarUrl : f.Requester!.AvatarUrl,
                Status = f.Status
            })
            .ToListAsync();
    }

    public async Task<(IEnumerable<FriendResponseDto> friendships, int totalCount)> GetUserFriendsPaginatedAsync(Guid userId, int page, int pageSize)
    {
        var query = _context.Friendships
            .AsNoTracking()
            .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && f.Status == "ACCEPTED");
            
        var totalCount = await query.CountAsync();
        
        var friends = await query
            .OrderBy(f => f.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(f => new FriendResponseDto
            {
                UserId = f.RequesterId == userId ? f.AddresseeId : f.RequesterId,
                Username = f.RequesterId == userId ? f.Addressee!.Username : f.Requester!.Username,
                DisplayName = f.RequesterId == userId ? f.Addressee!.DisplayName : f.Requester!.DisplayName,
                DiscordNickname = f.RequesterId == userId ? f.Addressee!.Username : f.Requester!.Username,
                AvatarUrl = f.RequesterId == userId ? f.Addressee!.AvatarUrl : f.Requester!.AvatarUrl,
                Status = f.Status
            })
            .ToListAsync();
            
        return (friends, totalCount);
    }

    public async Task<(IEnumerable<Friendship> incoming, IEnumerable<Friendship> outgoing)> GetFriendRequestsAsync(Guid userId)
    {
        var incoming = await _context.Friendships
            .AsNoTracking()
            .Include(f => f.Requester)
            .Where(f => f.AddresseeId == userId && f.Status == "PENDING")
            .Take(50)
            .ToListAsync();
            
        var outgoing = await _context.Friendships
            .AsNoTracking()
            .Include(f => f.Addressee)
            .Where(f => f.RequesterId == userId && f.Status == "PENDING")
            .Take(50)
            .ToListAsync();
            
        return (incoming, outgoing);
    }

    public async Task RemoveFriendshipAsync(Friendship friendship)
    {
        _context.Friendships.Remove(friendship);
        await _context.SaveChangesAsync();
    }
}