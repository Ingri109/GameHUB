using GameHUB.Data;
using GameHUB.DTOs;
using GameHUB.Repositories;
using Microsoft.EntityFrameworkCore;

using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace GameHUB.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IDistributedCache _cache;
    private readonly ILogger<UserService> _logger;

    public UserService(
        AppDbContext context,
        IUserRepository userRepository,
        IDistributedCache cache,
        ILogger<UserService> logger)
    {
        _context = context;
        _userRepository = userRepository;
        _cache = cache;
        _logger = logger;
    }

    public async Task<UserProfileDetailDto?> GetUserProfileAsync(Guid userId, Guid requestorId)
    {
        // Execute queries sequentially because a single DbContext block cannot execute
        // multiple queries concurrently. By removing heavy includes and adding AsNoTracking,
        // these queries are exceptionally fast and avoid large RAM spikes.
        
        var user = await _userRepository.GetUserProfileAsync(userId);
        if (user == null) return null;

        // Fetch Awards (Aggregated in SQL)
        var wallOfFame = await _context.UserAwards
            .AsNoTracking()
            .Where(ua => ua.ReceiverId == userId)
            .GroupBy(ua => new { 
                Title = ua.AwardTemplate != null ? ua.AwardTemplate.Name : (ua.CustomTitle ?? "Unknown"), 
                IconUrl = ua.AwardTemplate != null ? ua.AwardTemplate.IconUrl : null 
            })
            .Select(g => new UserAwardDto
            {
                Title = g.Key.Title,
                IconUrl = g.Key.IconUrl,
                Count = g.Count()
            })
            .ToListAsync();

        // Fetch Global Badges
        var badges = await _context.UserGlobalBadges
            .AsNoTracking()
            .Where(b => b.UserId == userId)
            .Select(b => new GlobalBadgeDto
            {
                BadgeName = b.BadgeName,
                AwardedAt = b.AwardedAt,
                Year = b.Year
            })
            .ToListAsync();

        // Fetch Friends via optimized Select projection
        var friendsDto = await _context.Friendships
            .AsNoTracking()
            .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && f.Status == "ACCEPTED")
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

        // Calculate Co-Op Hours via SQL SumAsync
        var coOpHoursSum = await _context.SessionParticipants
            .AsNoTracking()
            .Where(sp => sp.UserId == userId && sp.Session != null && sp.Session.StartedAt != null && sp.Session.EndedAt != null)
            .SumAsync(sp => (sp.Session!.EndedAt!.Value - sp.Session!.StartedAt!.Value).TotalHours);
            
        var coOpHours = (int)coOpHoursSum;

        // Map Game Tiers
        var gameTiers = user.Tiers.Select(t => new GameTierDto
        {
            GameId = t.GameId,
            Title = t.Game?.Title ?? "Unknown Game",
            CoverUrl = t.Game?.CoverUrl,
            IgdbId = t.Game?.IgdbId,
            Tier = t.Tier.ToString()
        }).ToList();

        return new UserProfileDetailDto
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName, 
            AvatarUrl = user.AvatarUrl,
            ReliabilityScore = user.ReliabilityScore,
            CreatedAt = user.CreatedAt,
            CoOpHours = coOpHours,
            WallOfFame = wallOfFame,
            GlobalBadges = badges,
            GameTiers = gameTiers,
            Friends = friendsDto
        };
    }

    public async Task<GlobalContextDto?> GetGlobalContextAsync(Guid userId)
    {
        return await _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => new GlobalContextDto
            {
                Id = u.Id,
                Username = u.Username,
                DisplayName = u.DisplayName,
                AvatarUrl = u.AvatarUrl,
                ReliabilityScore = u.ReliabilityScore,
                UnreadNotificationCount = _context.UserNotifications.Count(n => n.UserId == userId && !n.IsRead),
                PendingFriendRequestCount = _context.Friendships.Count(f => f.AddresseeId == userId && f.Status == "PENDING")
            })
            .FirstOrDefaultAsync();
    }

    public async Task<UserProfileAggregateDto?> GetUserProfileAggregateAsync(string username, Guid requestorId)
    {
        var cacheKey = $"profile:aggregate:{username.ToLower()}";
        UserProfileAggregateDto? result = null;

        try
        {
            var cachedData = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedData))
            {
                result = JsonSerializer.Deserialize<UserProfileAggregateDto>(cachedData);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis cache unavailable during GetUserProfileAggregateAsync Get. Ignoring.");
        }

        if (result == null)
        {
            result = await _context.Users
                .AsNoTracking()
                .Where(u => u.Username.ToLower() == username.ToLower())
                .Select(u => new UserProfileAggregateDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    DisplayName = u.DisplayName,
                    AvatarUrl = u.AvatarUrl,
                    ReliabilityScore = u.ReliabilityScore,
                    CreatedAt = u.CreatedAt,
                    
                    CoOpHours = (int)_context.SessionParticipants
                        .Where(sp => sp.UserId == u.Id && sp.Session != null && sp.Session.StartedAt != null && sp.Session.EndedAt != null)
                        .Sum(sp => (sp.Session!.EndedAt!.Value - sp.Session!.StartedAt!.Value).TotalHours),
                        
                    RecentTiers = u.Tiers
                        .OrderBy(t => t.Tier)
                        .Take(4)
                        .Select(t => new GameTierDto
                        {
                            GameId = t.GameId,
                            Title = t.Game!.Title,
                            CoverUrl = t.Game.CoverUrl,
                            IgdbId = t.Game.IgdbId,
                            Tier = t.Tier.ToString()
                        })
                        .ToList(),
                        
                    TopAwards = _context.UserAwards
                        .Where(ua => ua.ReceiverId == u.Id)
                        .GroupBy(ua => new { 
                            Title = ua.AwardTemplate != null ? ua.AwardTemplate.Name : (ua.CustomTitle ?? "Unknown"), 
                            IconUrl = ua.AwardTemplate != null ? ua.AwardTemplate.IconUrl : null 
                        })
                        .Select(g => new UserAwardDto
                        {
                            Title = g.Key.Title,
                            IconUrl = g.Key.IconUrl,
                            Count = g.Count()
                        })
                        .OrderByDescending(x => x.Count)
                        .ToList()
                })
                .FirstOrDefaultAsync();
                
            if (result == null) return null;

            try
            {
                var options = new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
                };
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), options);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis cache unavailable during GetUserProfileAggregateAsync Set. Ignoring.");
            }
        }
            
        string friendshipStatus = "NONE";
        if (requestorId != Guid.Empty && requestorId != result.Id)
        {
            var f = await _context.Friendships
                .AsNoTracking()
                .Where(x => (x.RequesterId == requestorId && x.AddresseeId == result.Id) || (x.RequesterId == result.Id && x.AddresseeId == requestorId))
                .FirstOrDefaultAsync();
                
            if (f != null)
            {
                if (f.Status == "ACCEPTED") friendshipStatus = "FRIEND";
                else if (f.Status == "PENDING")
                {
                    if (f.RequesterId == requestorId) friendshipStatus = "PENDING_OUTGOING";
                    else friendshipStatus = "PENDING_INCOMING";
                }
                else friendshipStatus = f.Status;
            }
        }
        
        result.FriendshipStatus = friendshipStatus;

        return result;
    }

}
