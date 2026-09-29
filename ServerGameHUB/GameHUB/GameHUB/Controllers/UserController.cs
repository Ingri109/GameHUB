using GameHUB.DTOs;
using GameHUB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GameHUB.Data;
using System.Security.Claims;

namespace GameHUB.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }


    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromServices] AppDbContext context, [FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return Ok(new List<object>()); // Empty list if no query

        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var currentUserId))
            return Unauthorized();

        var query = q.ToLower();
        var users = await context.Users
            .AsNoTracking()
            .Where(u => u.Id != currentUserId && u.Username.ToLower().Contains(query))
            .OrderBy(u => u.Username)
            .Take(10)
            .Select(u => new
            {
                Id = u.Id,
                DiscordNickname = u.Username,
                AvatarUrl = u.AvatarUrl,
                RelationshipStatus = context.Friendships
                    .Where(f => (f.RequesterId == currentUserId && f.AddresseeId == u.Id) || (f.RequesterId == u.Id && f.AddresseeId == currentUserId))
                    .Select(f => f.Status)
                    .FirstOrDefault() ?? "NONE"
            })
            .ToListAsync();

        return Ok(users);
    }

    [HttpGet("profile")]
    public async Task<ActionResult<UserProfileDetailDto>> GetMyProfile()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized();

        var profile = await _userService.GetUserProfileAsync(userId, userId);
        if (profile == null) return NotFound("User not found");

        return Ok(profile);
    }
    
    [AllowAnonymous] // or Authorize?
    [HttpGet("by-username/{username}/profile")]
    public async Task<ActionResult<UserProfileDetailDto>> GetUserProfileByUsername([FromServices] AppDbContext context, string username)
    {
        var requestorIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid requestorId = Guid.Empty;
        if (requestorIdString != null) {
            Guid.TryParse(requestorIdString, out requestorId);
        }

        var tgtUserId = await context.Users
            .AsNoTracking()
            .Where(u => u.Username.ToLower() == username.ToLower())
            .Select(u => u.Id)
            .FirstOrDefaultAsync();
            
        if (tgtUserId == Guid.Empty) return NotFound("User not found.");

        var profile = await _userService.GetUserProfileAsync(tgtUserId, requestorId);
        if (profile == null) return NotFound("User not found");

        return Ok(profile);
    }

    [AllowAnonymous]
    [HttpGet("{username}/games")]
    public async Task<IActionResult> GetUserTierListGames([FromServices] AppDbContext context, string username)
    {
        var userId = await context.Users
            .AsNoTracking()
            .Where(u => u.Username.ToLower() == username.ToLower())
            .Select(u => u.Id)
            .FirstOrDefaultAsync();
            
        if (userId == Guid.Empty) return NotFound("User not found.");

        var tiers = await context.UserGameTiers
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .Select(t => new
            {
                GameId = t.GameId,
                Title = t.Game!.Title,
                CoverUrl = t.Game.CoverUrl,
                IgdbId = t.Game.IgdbId,
                Tier = t.Tier.ToString()
            })
            .ToListAsync();

        return Ok(tiers);
    }
    [HttpGet("context")]
    public async Task<ActionResult<GlobalContextDto>> GetGlobalContext()
    {
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdString, out var userId))
            return Unauthorized();

        var ctx = await _userService.GetGlobalContextAsync(userId);
        if (ctx == null) return NotFound("User not found");

        return Ok(ctx);
    }

    [AllowAnonymous]
    [HttpGet("by-username/{username}/aggregate")]
    public async Task<ActionResult<UserProfileAggregateDto>> GetUserProfileAggregate(string username)
    {
        var requestorIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid requestorId = Guid.Empty;
        if (requestorIdString != null) {
            Guid.TryParse(requestorIdString, out requestorId);
        }

        var profile = await _userService.GetUserProfileAggregateAsync(username, requestorId);
        if (profile == null) return NotFound("User not found");

        return Ok(profile);
    }

}
