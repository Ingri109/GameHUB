using System.Text.Json;
using GameHUB.Data;
using GameHUB.DTOs;
using GameHUB.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace GameHUB.Services;

public class ScheduleService : IScheduleService
{
    private readonly AppDbContext _dbContext;
    private readonly IDistributedCache _cache;
    private readonly ILogger<ScheduleService> _logger;

    public ScheduleService(AppDbContext dbContext, IDistributedCache cache, ILogger<ScheduleService> logger)
    {
        _dbContext = dbContext;
        _cache = cache;
        _logger = logger;
    }

    private string GetCacheKey(Guid userId) => $"user_schedule_{userId}";

    public async Task<UserScheduleResponse> GetUserScheduleAsync(Guid userId)
    {
        var cacheKey = GetCacheKey(userId);
        string? cachedData = null;
        try
        {
            cachedData = await _cache.GetStringAsync(cacheKey);
        }
        catch (StackExchange.Redis.RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis cache unavailable during GetUserScheduleAsync. Falling back to DB.");
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Redis cache unavailable during GetUserScheduleAsync. Falling back to DB.");
        }

        if (!string.IsNullOrEmpty(cachedData))
        {
            var cachedBlocks = JsonSerializer.Deserialize<List<ScheduleBlockDto>>(cachedData);
            if (cachedBlocks != null)
            {
                return new UserScheduleResponse { UserId = userId, Blocks = cachedBlocks };
            }
        }

        var currentDate = DateOnly.FromDateTime(DateTime.Today);
        var blocks = await _dbContext.ScheduleBlocks
            .AsNoTracking()
            .Where(sb => sb.UserId == userId && sb.Date >= currentDate)
            .Select(sb => new ScheduleBlockDto
            {
                Date = sb.Date,
                BlockType = sb.BlockType,
                Status = sb.Status,
                ExactStartTime = sb.ExactStartTime,
                ExactEndTime = sb.ExactEndTime
            })
            .ToListAsync();

        var options = new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7)
        };
        _ = Task.Run(async () => 
        {
            try
            {
                await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(blocks), options);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Redis cache unavailable during GetUserScheduleAsync. Ignoring cache set failure.");
            }
        });

        return new UserScheduleResponse { UserId = userId, Blocks = blocks };
    }

    public async Task<List<UserScheduleResponse>> GetFriendsSchedulesAsync(Guid userId)
    {
        var friendIds = await _dbContext.Friendships
            .AsNoTracking()
            .Where(f => (f.RequesterId == userId || f.AddresseeId == userId) && f.Status == "ACCEPTED")
            .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
            .ToListAsync();

        if (!friendIds.Any())
            return new List<UserScheduleResponse>();

        var currentDate = DateOnly.FromDateTime(DateTime.Today);
        
        var friendSchedulesQuery = await _dbContext.ScheduleBlocks
            .AsNoTracking()
            .Where(sb => friendIds.Contains(sb.UserId) && sb.Date >= currentDate)
            .Select(sb => new 
            {
                sb.UserId,
                Block = new ScheduleBlockDto
                {
                    Date = sb.Date,
                    BlockType = sb.BlockType,
                    Status = sb.Status,
                    ExactStartTime = sb.ExactStartTime,
                    ExactEndTime = sb.ExactEndTime
                }
            })
            .ToListAsync();

        var responses = friendIds.Select(fid => new UserScheduleResponse 
        {
            UserId = fid,
            Blocks = friendSchedulesQuery.Where(s => s.UserId == fid).Select(s => s.Block).ToList()
        }).ToList();

        return responses;
    }

    public async Task UpdateScheduleAsync(Guid userId, UpdateScheduleRequest request)
    {
        var currentDate = DateOnly.FromDateTime(DateTime.Today);
        var requestedDates = request.Blocks.Select(b => b.Date).Distinct().ToList();

        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        try
        {
            // We only want to delete existing blocks for the dates being updated, 
            // or just delete from today onwards?
            // "accepts an array of modified schedule blocks and saves them efficiently"
            // Usually, batch update means we delete existing for those exact dates and insert new ones.
            // But if it's the full visible calendar being posted, we could delete >= currentDate.
            // Let's delete only for the dates provided in the request to be safer and allow partial updates.
            
            if (requestedDates.Any())
            {
                await _dbContext.ScheduleBlocks
                    .Where(sb => sb.UserId == userId && requestedDates.Contains(sb.Date))
                    .ExecuteDeleteAsync();

                var newBlocks = request.Blocks.Where(b => b.Status != ScheduleStatus.DefaultOrUnavailable)
                    .Select(b => new ScheduleBlock
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        Date = b.Date,
                        BlockType = b.BlockType,
                        Status = b.Status,
                        ExactStartTime = b.ExactStartTime,
                        ExactEndTime = b.ExactEndTime
                    }).ToList();

                if (newBlocks.Any())
                {
                    _dbContext.ScheduleBlocks.AddRange(newBlocks);
                }

                await _dbContext.SaveChangesAsync();
            }

            await transaction.CommitAsync();

            // Overwrite specific Redis key for this user
            var allFutureBlocks = await _dbContext.ScheduleBlocks
                .AsNoTracking()
                .Where(sb => sb.UserId == userId && sb.Date >= currentDate)
                .Select(sb => new ScheduleBlockDto
                {
                    Date = sb.Date,
                    BlockType = sb.BlockType,
                    Status = sb.Status,
                    ExactStartTime = sb.ExactStartTime,
                    ExactEndTime = sb.ExactEndTime
                })
                .ToListAsync();

            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(7)
            };
            _ = Task.Run(async () => 
            {
                try
                {
                    await _cache.SetStringAsync(GetCacheKey(userId), JsonSerializer.Serialize(allFutureBlocks), options);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Redis cache unavailable during UpdateScheduleAsync. Ignoring cache set failure.");
                }
            });
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to update schedule for user {UserId}", userId);
            throw;
        }
    }
}
