using System;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Channels;
using System.Threading.Tasks;
using GameHUB.Data;
using GameHUB.DTOs.Notification;
using GameHUB.Models;
using GameHUB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameHUB.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly SseNotificationService _sseService;

    public NotificationController(AppDbContext context, SseNotificationService sseService)
    {
        _context = context;
        _sseService = sseService;
    }

    private Guid GetCurrentUserId()
    {
        var idStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(idStr, out var id) ? id : Guid.Empty;
    }

    [HttpGet("stream")]
    public async Task GetStream()
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty)
        {
            Response.StatusCode = 401;
            return;
        }

        Response.Headers.Append("Content-Type", "text/event-stream");
        Response.Headers.Append("Cache-Control", "no-cache");
        Response.Headers.Append("Connection", "keep-alive");

        var channel = Channel.CreateUnbounded<string>();
        var connectionId = _sseService.AddClient(userId, channel);

        try
        {
            var cancellationToken = HttpContext.RequestAborted;
            
            while (!cancellationToken.IsCancellationRequested)
            {
                using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                cts.CancelAfter(TimeSpan.FromSeconds(15));
                
                try
                {
                    var message = await channel.Reader.ReadAsync(cts.Token);
                    await Response.WriteAsync($"data: {message}\n\n", cancellationToken);
                    await Response.Body.FlushAsync(cancellationToken);
                }
                catch (OperationCanceledException)
                {
                    if (cancellationToken.IsCancellationRequested) break;
                    
                    // Keep-alive ping
                    await Response.WriteAsync(":\n\n", cancellationToken);
                    await Response.Body.FlushAsync(cancellationToken);
                }
            }
        }
        finally
        {
            _sseService.RemoveClient(userId, connectionId);
        }
    }


    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetCurrentUserId();
        if (userId == Guid.Empty) return Unauthorized();

        // Count pending internal notifications
        var notificationCount = await _context.UserNotifications
            .AsNoTracking()
            .CountAsync(n => n.UserId == userId && !n.IsResolved);
            
        // Count incoming friend requests
        var friendRequestCount = await _context.Friendships
            .AsNoTracking()
            .CountAsync(f => f.AddresseeId == userId && f.Status == "PENDING");

        return Ok(new { count = notificationCount + friendRequestCount, notifications = notificationCount, friendRequests = friendRequestCount });
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        var userId = GetCurrentUserId();
        
        var dtos = await _context.UserNotifications
            .AsNoTracking()
            .Where(n => n.UserId == userId && !n.IsResolved)
            .OrderByDescending(n => n.CreatedAt)
            .Take(30)
            .Select(n => new UserNotificationDto
            {
                Id = n.Id,
                Type = n.Type.ToString(),
                Message = n.Message,
                IsRead = n.IsRead,
                IsResolved = n.IsResolved,
                ReferenceId = n.ReferenceId,
                CreatedAt = n.CreatedAt,
                Lobby = (n.Type == NotificationType.PostSessionReview && n.ReferenceId.HasValue) 
                    ? _context.Sessions
                        .Where(s => s.Id == n.ReferenceId.Value)
                        .OrderBy(s => s.Id)
                        .Select(lobby => new LobbySummaryDto
                        {
                            Id = lobby.Id,
                            Name = lobby.Name,
                            GameName = lobby.Game != null ? lobby.Game.Title : "Unknown Game",
                            StartedAt = lobby.StartedAt ?? lobby.ScheduledFor,
                            Participants = lobby.Participants
                                .Where(p => p.Status == ParticipantStatus.JOINED && p.UserId != userId)
                                .OrderBy(p => p.JoinedAt)
                                .Take(3)
                                .Select(p => new ParticipantSummaryDto
                                {
                                    UserId = p.UserId,
                                    Username = p.User != null ? p.User.Username : "Unknown",
                                    DisplayName = p.User != null ? p.User.DisplayName : "Unknown",
                                    AvatarUrl = p.User != null ? p.User.AvatarUrl : null
                                }).ToList()
                        }).FirstOrDefault()
                    : null
            })
            .ToListAsync();

        return Ok(dtos);
    }}
