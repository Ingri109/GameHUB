using GameHUB.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using GameHUB.Models;
using System;
using System.Threading.Tasks;
using System.Linq;

namespace GameHUB.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GamesController : ControllerBase
{
    private readonly IgdbService _igdbService;

    public GamesController(IgdbService igdbService)
    {
        _igdbService = igdbService;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
        return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
    }

    [Authorize]
    [HttpGet("my-tiers")]
    public async Task<IActionResult> GetMyTiers([FromServices] GameHUB.Data.AppDbContext context)
    {
        var userId = GetCurrentUserId();
        var tiers = await context.UserGameTiers
            .Include(t => t.Game)
            .Where(t => t.UserId == userId)
            .Select(t => new
            {
                t.GameId,
                Title = t.Game.Title,
                CoverUrl = t.Game.CoverUrl,
                IgdbId = t.Game.IgdbId,
                Tier = t.Tier.ToString()
            })
            .ToListAsync();

        return Ok(tiers);
    }

    

    [Authorize]
    [HttpPost("tier")]
    public async Task<IActionResult> UpdateTier([FromServices] GameHUB.Data.AppDbContext context, [FromBody] UpdateTierRequest req)
    {
        var userId = GetCurrentUserId();
        
        Game game = null;
        if (req.GameId.HasValue && req.GameId.Value != Guid.Empty)
        {
            game = await context.Games.FindAsync(req.GameId.Value);
        }
        else if (req.IgdbId.HasValue)
        {
            game = await context.Games.FirstOrDefaultAsync(g => g.IgdbId == req.IgdbId.Value);
            if (game == null)
            {
                game = new Game
                {
                    Id = Guid.NewGuid(),
                    IgdbId = req.IgdbId.Value,
                    Title = req.Title,
                    CoverUrl = req.CoverUrl,
                    MinPlayers = 1,
                    MaxPlayers = 99
                };
                context.Games.Add(game);
                await context.SaveChangesAsync();
            }
        }
        
        if (game == null) return BadRequest("Game info is missing.");

        var userTier = await context.UserGameTiers.FindAsync(userId, game.Id);
        
        if (!Enum.TryParse<GameHUB.Models.Tier>(req.Tier, true, out var parsedTier))
        {
            return BadRequest("Invalid tier value.");
        }

        if (userTier == null)
        {
            userTier = new GameHUB.Models.UserGameTier
            {
                UserId = userId,
                GameId = game.Id,
                Tier = parsedTier
            };
            context.UserGameTiers.Add(userTier);
        }
        else
        {
            userTier.Tier = parsedTier;
        }

        await context.SaveChangesAsync();
        return Ok(new { GameId = game.Id, Tier = parsedTier.ToString() });
    }

    

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest();
        
        var results = await _igdbService.SearchGamesAsync(q);
        return Ok(results);
    }
}

public class UpdateTierRequest
{
    public Guid? GameId { get; set; }
    public long? IgdbId { get; set; }
    public string? Title { get; set; }
    public string? CoverUrl { get; set; }
    public string Tier { get; set; }
}
