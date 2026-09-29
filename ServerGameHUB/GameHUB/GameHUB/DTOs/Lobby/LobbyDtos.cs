using System;
using System.Collections.Generic;

namespace GameHUB.DTOs.Lobby;

public class CreateLobbyDto
{
    public string? Name { get; set; }
    public Guid? GameId { get; set; }
    public long? IgdbGameId { get; set; }
    public string? GameTitle { get; set; }
    public string? GameCoverUrl { get; set; }
    public DateTime? ScheduledFor { get; set; }
    public int? PlayerLimit { get; set; }
    public string InviteToken { get; set; } = string.Empty;
    public List<Guid>? InvitedFriendIds { get; set; }
}

public class UpdateLobbyDto
{
    public string? Name { get; set; }
    public DateTime? ScheduledFor { get; set; }
    public int? PlayerLimit { get; set; }
    public string InviteToken { get; set; } = string.Empty;
}

public class LobbyResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid GameId { get; set; }
    public Guid? HostId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ScheduledFor { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public int? PlayerLimit { get; set; }
    public string InviteToken { get; set; } = string.Empty;
    
    // Front-end requested infos (game icon etc would be merged here or at frontend)
    public GameDto? Game { get; set; }
    public List<LobbyParticipantDto> Participants { get; set; } = new();
}

public class GameDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
}

public class LobbyParticipantDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? JoinedAt { get; set; }
}

public class GiveAwardDto
{
    public Guid ReceiverId { get; set; }
    public Guid? AwardTemplateId { get; set; }
    public string? CustomTitle { get; set; }
    public string? Note { get; set; }
}
