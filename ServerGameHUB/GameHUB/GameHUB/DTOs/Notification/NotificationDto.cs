using System;
using System.Collections.Generic;
using GameHUB.DTOs.Lobby;

namespace GameHUB.DTOs.Notification;

public class UserNotificationDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public bool IsResolved { get; set; }
    public Guid? ReferenceId { get; set; }
    public DateTime CreatedAt { get; set; }
    
    // Additional payload for UI
    public LobbySummaryDto? Lobby { get; set; }
}

public class LobbySummaryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string GameName { get; set; } = string.Empty;
    public DateTime? StartedAt { get; set; }
    public List<ParticipantSummaryDto> Participants { get; set; } = [];
}

public class ParticipantSummaryDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
}
