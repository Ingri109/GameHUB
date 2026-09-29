using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using GameHUB.Data;
using GameHUB.DTOs.Lobby;
using GameHUB.Models;
using GameHUB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameHUB.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LobbyController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly SseNotificationService _sseService;

    public LobbyController(AppDbContext context, SseNotificationService sseService)
    {
        _context = context;
        _sseService = sseService;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetMyActiveLobbies()
    {
        var userId = GetCurrentUserId();

        var missingTokens = await _context.Sessions
            .Where(s => s.Participants.Any(p => p.UserId == userId && (p.Status == ParticipantStatus.JOINED || p.Status == ParticipantStatus.INVITED)) 
                        && s.Status != SessionStatus.COMPLETED 
                        && s.Status != SessionStatus.CANCELLED
                        && string.IsNullOrEmpty(s.InviteToken))
            .ToListAsync();

        if (missingTokens.Any())
        {
            foreach (var l in missingTokens)
            {
                l.InviteToken = Guid.NewGuid().ToString("N");
            }
            await _context.SaveChangesAsync();
        }

        var dtos = await _context.Sessions
            .AsNoTracking()
            .Where(s => s.Participants.Any(p => p.UserId == userId && (p.Status == ParticipantStatus.JOINED || p.Status == ParticipantStatus.INVITED)) 
                        && s.Status != SessionStatus.COMPLETED 
                        && s.Status != SessionStatus.CANCELLED)
            .OrderBy(s => s.ScheduledFor)
            .Select(lobby => new LobbyResponseDto
            {
                Id = lobby.Id,
                Name = lobby.Name,
                GameId = lobby.GameId,
                HostId = lobby.HostId,
                Status = lobby.Status.ToString(),
                ScheduledFor = lobby.ScheduledFor,
                StartedAt = lobby.StartedAt,
                EndedAt = lobby.EndedAt,
                PlayerLimit = lobby.PlayerLimit,
                InviteToken = lobby.InviteToken,
                Game = lobby.Game != null ? new GameDto
                {
                    Id = lobby.Game.Id,
                    Title = lobby.Game.Title,
                    CoverUrl = lobby.Game.CoverUrl
                } : null,
                Participants = lobby.Participants.Select(p => new LobbyParticipantDto
                {
                    UserId = p.UserId,
                    Username = p.User != null ? p.User.Username : "Unknown",
                    DisplayName = p.User != null ? p.User.DisplayName : "Unknown",
                    AvatarUrl = p.User != null ? p.User.AvatarUrl : null,
                    Status = p.Status.ToString(),
                    JoinedAt = p.JoinedAt
                }).ToList()
            })
            .ToListAsync();

        return Ok(dtos);
    }

    [HttpPost]
    public async Task<IActionResult> CreateLobby([FromBody] CreateLobbyDto dto)
    {
        var userId = GetCurrentUserId();
        
        Game game = null;

        if (dto.GameId.HasValue && dto.GameId.Value != Guid.Empty)
        {
            game = await _context.Games.FindAsync(dto.GameId.Value);
        }
        else if (dto.IgdbGameId.HasValue)
        {
            game = await _context.Games.FirstOrDefaultAsync(g => g.IgdbId == dto.IgdbGameId.Value);
            
            if (game == null)
            {
                if (string.IsNullOrWhiteSpace(dto.GameTitle))
                {
                    return BadRequest("GameTitle is required when creating a lobby from IGDB.");
                }

                game = new Game
                {
                    Id = Guid.NewGuid(),
                    IgdbId = dto.IgdbGameId,
                    Title = dto.GameTitle,
                    CoverUrl = dto.GameCoverUrl,
                    MinPlayers = 1,
                    MaxPlayers = 99
                };
                
                _context.Games.Add(game);
                await _context.SaveChangesAsync();
            }
        }

        if (game == null) return NotFound("Game not found or unable to create from IGDB.");

        string lobbyName = string.IsNullOrWhiteSpace(dto.Name) 
            ? $"{game.Title} {dto.PlayerLimit?.ToString() ?? "Lobby"}" 
            : dto.Name;

        var session = new Session
        {
            Id = Guid.NewGuid(),
            Name = lobbyName,
            GameId = game.Id,
            HostId = userId,
            ScheduledFor = dto.ScheduledFor,
            PlayerLimit = dto.PlayerLimit,
            Status = SessionStatus.GATHERING,
            IsPrivate = true // lobbys are basically private by default if inviting friends
        };

        // Add Host as JOINED participant
        _context.SessionParticipants.Add(new SessionParticipant
        {
            SessionId = session.Id,
            UserId = userId,
            Status = ParticipantStatus.JOINED,
            JoinedAt = DateTime.UtcNow
        });

        _context.Sessions.Add(session);

        // Invite friends
        if (dto.InvitedFriendIds != null && dto.InvitedFriendIds.Any())
        {
            foreach (var friendId in dto.InvitedFriendIds)
            {
                if (friendId == userId) continue;

                // Check friendship
                var isFriend = await _context.Friendships.AnyAsync(f =>
                    ((f.RequesterId == userId && f.AddresseeId == friendId) ||
                     (f.RequesterId == friendId && f.AddresseeId == userId)) &&
                    f.Status == "ACCEPTED");

                if (isFriend)
                {
                    _context.SessionParticipants.Add(new SessionParticipant
                    {
                        SessionId = session.Id,
                        UserId = friendId,
                        Status = ParticipantStatus.INVITED
                    });
                }
            }
        }

        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetLobby), new { id = session.Id }, new { Id = session.Id });
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetLobby(Guid id)
    {
        var needsToken = await _context.Sessions
            .Where(s => s.Id == id && string.IsNullOrEmpty(s.InviteToken))
            .FirstOrDefaultAsync();

        if (needsToken != null)
        {
            needsToken.InviteToken = Guid.NewGuid().ToString("N");
            await _context.SaveChangesAsync();
        }

        var dto = await _context.Sessions
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(lobby => new LobbyResponseDto
            {
                Id = lobby.Id,
                Name = lobby.Name,
                GameId = lobby.GameId,
                HostId = lobby.HostId,
                Status = lobby.Status.ToString(),
                ScheduledFor = lobby.ScheduledFor,
                StartedAt = lobby.StartedAt,
                EndedAt = lobby.EndedAt,
                PlayerLimit = lobby.PlayerLimit,
                InviteToken = lobby.InviteToken,
                Game = lobby.Game != null ? new GameDto
                {
                    Id = lobby.Game.Id,
                    Title = lobby.Game.Title,
                    CoverUrl = lobby.Game.CoverUrl
                } : null,
                Participants = lobby.Participants.Select(p => new LobbyParticipantDto
                {
                    UserId = p.UserId,
                    Username = p.User != null ? p.User.Username : "Unknown",
                    DisplayName = p.User != null ? p.User.DisplayName : "Unknown",
                    AvatarUrl = p.User != null ? p.User.AvatarUrl : null,
                    Status = p.Status.ToString(),
                    JoinedAt = p.JoinedAt
                }).ToList()
            })
            .FirstOrDefaultAsync();

        if (dto == null) return NotFound();

        return Ok(dto);
    }

    [HttpPost("{id}/invite")]
    public async Task<IActionResult> InviteToLobby(Guid id, [FromBody] Guid friendId)
    {
        var userId = GetCurrentUserId();
        var lobby = await _context.Sessions.FindAsync(id);
        
        if (lobby == null) return NotFound("Lobby not found.");
        if (lobby.HostId != userId) return Forbid(); // Only host can invite

        // Check friendship
        var isFriend = await _context.Friendships.AnyAsync(f => 
            ((f.RequesterId == userId && f.AddresseeId == friendId) || 
             (f.RequesterId == friendId && f.AddresseeId == userId)) && 
            f.Status == "ACCEPTED");

        if (!isFriend)
        {
            return BadRequest(new { message = "You can only invite friends to the lobby.", errorUrl = "/errors/not-friends" });
        }

        var existingParticipant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == id && p.UserId == friendId);

        if (existingParticipant != null)
        {
            return BadRequest("User is already in the lobby or invited.");
        }

        _context.SessionParticipants.Add(new SessionParticipant
        {
            SessionId = id,
            UserId = friendId,
            Status = ParticipantStatus.INVITED
        });

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/accept")]
    public async Task<IActionResult> AcceptInvite(Guid id)
    {
        var userId = GetCurrentUserId();
        var participant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == id && p.UserId == userId);
            
        if (participant == null) return NotFound("Invite not found.");
        if (participant.Status != ParticipantStatus.INVITED) return BadRequest("Invite no longer valid.");

        var lobby = await _context.Sessions.Include(s => s.Participants).FirstOrDefaultAsync(s => s.Id == id);
        if (lobby == null) return NotFound();

        var joinedCount = lobby.Participants.Count(p => p.Status == ParticipantStatus.JOINED);
        if (lobby.PlayerLimit.HasValue && joinedCount >= lobby.PlayerLimit.Value)
        {
            return BadRequest("Lobby is full.");
        }

        participant.Status = ParticipantStatus.JOINED;
        participant.JoinedAt = DateTime.UtcNow;

        if (lobby.HostId == null) // Bot created lobby, assign first joined user as host
        {
            lobby.HostId = userId;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/decline")]
    public async Task<IActionResult> DeclineInvite(Guid id)
    {
        var userId = GetCurrentUserId();
        var participant = await _context.SessionParticipants
            .FirstOrDefaultAsync(p => p.SessionId == id && p.UserId == userId);
            
        if (participant == null) return NotFound("Invite not found.");
        
        participant.Status = ParticipantStatus.DECLINED;

        await _context.SaveChangesAsync();
        return Ok();
    }
    
    [HttpPost("{id}/end")]
    public async Task<IActionResult> EndLobby(Guid id)
    {
        var userId = GetCurrentUserId();
        var lobby = await _context.Sessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        if (lobby == null) return NotFound();
        if (lobby.HostId != userId) return Forbid(); // Only host can end
        
        lobby.Status = SessionStatus.COMPLETED;
        lobby.EndedAt = DateTime.UtcNow;
        
        // Generate notifications for all joined participants
        var joinedParticipants = lobby.Participants.Where(p => p.Status == ParticipantStatus.JOINED).ToList();
        
        // If there's only 1 person (just the host), don't bother creating reviews
        if (joinedParticipants.Count > 1) 
        {
            foreach (var participant in joinedParticipants)
            {
                _context.UserNotifications.Add(new UserNotification
                {
                    UserId = participant.UserId,
                    Type = NotificationType.PostSessionReview,
                    Message = $"Session \"{lobby.Name}\" is completed. Don't forget to rate your teammates!",
                    ReferenceId = lobby.Id
                });
            }
        }

        await _context.SaveChangesAsync();

        // Push SSE notification to each participant
        if (joinedParticipants.Count > 1) 
        {
            foreach (var participant in joinedParticipants)
            {
                await _sseService.SendNotificationAsync(participant.UserId, "{\"type\": \"NEW_REVIEW\"}");
            }
        }
        
        return Ok();
    }

    [HttpPost("{id}/awards")]
    public async Task<IActionResult> GiveAwards(Guid id, [FromBody] System.Collections.Generic.List<GiveAwardDto> awards)
    {
        var userId = GetCurrentUserId();
        var lobby = await _context.Sessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        if (lobby == null) return NotFound();
        if (lobby.Status != SessionStatus.COMPLETED) return BadRequest("Session must be completed to give awards.");
        
        var isParticipant = lobby.Participants.Any(p => p.UserId == userId && p.Status == ParticipantStatus.JOINED);
        if (!isParticipant) return Forbid();

        var joinedCount = lobby.Participants.Count(p => p.Status == ParticipantStatus.JOINED);
        int maxAwards = joinedCount > 1 ? joinedCount - 1 : 1; // Can give to all other players
        
        if (awards.Count > maxAwards) return BadRequest($"You can only give up to {maxAwards} awards.");

        foreach (var award in awards)
        {
            if (award.ReceiverId == userId) continue; 
            
            if (!string.IsNullOrEmpty(award.CustomTitle) && award.CustomTitle.Length > 50)
            {
                return BadRequest("Custom status cannot exceed 50 characters.");
            }

            _context.UserAwards.Add(new UserAward
            {
                Id = Guid.NewGuid(),
                SessionId = id,
                GiverId = userId,
                ReceiverId = award.ReceiverId,
                AwardTemplateId = award.AwardTemplateId,
                CustomTitle = award.CustomTitle,
                Note = award.Note,
                CreatedAt = DateTime.UtcNow
            });
        }
        
        // Mark as reviewed
        var participant = lobby.Participants.FirstOrDefault(p => p.UserId == userId);
        if (participant != null) participant.HasReviewed = true;
        
        // Resolve Notification
        var notif = await _context.UserNotifications.FirstOrDefaultAsync(n => n.UserId == userId && n.Type == NotificationType.PostSessionReview && n.ReferenceId == id);
        if (notif != null)
        {
            notif.IsResolved = true;
            notif.IsRead = true;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("{id}/awards/ignore")]
    public async Task<IActionResult> IgnoreReview(Guid id)
    {
        var userId = GetCurrentUserId();
        var lobby = await _context.Sessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.Id == id);
            
        if (lobby == null) return NotFound();
        if (lobby.Status != SessionStatus.COMPLETED) return BadRequest("Session must be completed to give awards.");
        
        var isParticipant = lobby.Participants.Any(p => p.UserId == userId && p.Status == ParticipantStatus.JOINED);
        if (!isParticipant) return Forbid();

        var participant = lobby.Participants.FirstOrDefault(p => p.UserId == userId);
        if (participant != null && !participant.HasReviewed) 
        {
            participant.HasReviewed = true;
            
            // Auto-assign default/random status (e.g. basic "Good Teammate" award)
            var defaultAward = await _context.AwardTemplates.FirstOrDefaultAsync();
            var otherPlayers = lobby.Participants.Where(p => p.UserId != userId && p.Status == ParticipantStatus.JOINED).ToList();
            
            if (defaultAward != null)
            {
                foreach (var other in otherPlayers)
                {
                    _context.UserAwards.Add(new UserAward
                    {
                        Id = Guid.NewGuid(),
                        SessionId = id,
                        GiverId = userId,
                        ReceiverId = other.UserId,
                        AwardTemplateId = defaultAward.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            var notif = await _context.UserNotifications.FirstOrDefaultAsync(n => n.UserId == userId && n.Type == NotificationType.PostSessionReview && n.ReferenceId == id);
            if (notif != null)
            {
                notif.IsResolved = true;
                notif.IsRead = true;
            }
            
            await _context.SaveChangesAsync();
        }

        return Ok();
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateLobby(Guid id, [FromBody] UpdateLobbyDto dto)
    {
        var userId = GetCurrentUserId();
        var lobby = await _context.Sessions.FindAsync(id);
        
        if (lobby == null) return NotFound();
        if (lobby.HostId != userId) return Forbid();
        if (lobby.Status != SessionStatus.GATHERING) return BadRequest("Lobby has already started.");

        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            lobby.Name = dto.Name;
        }

        if (dto.ScheduledFor.HasValue)
        {
            lobby.ScheduledFor = dto.ScheduledFor.Value;
        }

        if (dto.PlayerLimit.HasValue)
        {
            lobby.PlayerLimit = dto.PlayerLimit.Value;
        }

        await _context.SaveChangesAsync();
        return Ok();
    }

    [HttpPost("join/{token}")]
    public async Task<IActionResult> JoinByToken(string token)
    {
        var userId = GetCurrentUserId();
        var lobby = await _context.Sessions
            .Include(s => s.Participants)
            .FirstOrDefaultAsync(s => s.InviteToken == token);

        if (lobby == null) return NotFound("Lobby not found.");
        
        if (lobby.Status == SessionStatus.COMPLETED || lobby.Status == SessionStatus.CANCELLED)
        {
            return BadRequest("Lobby is no longer active.");
        }

        var existingParticipant = lobby.Participants.FirstOrDefault(p => p.UserId == userId);
        
        if (existingParticipant != null)
        {
            if (existingParticipant.Status == ParticipantStatus.JOINED)
            {
                // Already joined, that's fine, just return OK so they can enter.
                return Ok(new { LobbyId = lobby.Id });
            }
            else
            {
                // They were invited or declined, let's just make them joined.
                existingParticipant.Status = ParticipantStatus.JOINED;
                existingParticipant.JoinedAt = DateTime.UtcNow;
            }
        }
        else
        {
            // New participant, check limits
            var joinedCount = lobby.Participants.Count(p => p.Status == ParticipantStatus.JOINED);
            if (lobby.PlayerLimit.HasValue && joinedCount >= lobby.PlayerLimit.Value)
            {
                return StatusCode(403, "Lobby is full");
            }

            _context.SessionParticipants.Add(new SessionParticipant
            {
                SessionId = lobby.Id,
                UserId = userId,
                Status = ParticipantStatus.JOINED,
                JoinedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return Ok(new { LobbyId = lobby.Id });
    }
}
