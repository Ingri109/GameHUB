namespace GameHUB.DTOs;

public class UserProfileDetailDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double ReliabilityScore { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public int CoOpHours { get; set; } 
    public List<UserAwardDto> WallOfFame { get; set; } = [];
    public List<GlobalBadgeDto> GlobalBadges { get; set; } = [];
    public List<GameTierDto> GameTiers { get; set; } = [];
    public List<FriendResponseDto> Friends { get; set; } = [];
}

public class UserAwardDto
{
    public string Title { get; set; } = string.Empty;
    public string? IconUrl { get; set; }
    public int Count { get; set; }
}

public class GlobalBadgeDto
{
    public string BadgeName { get; set; } = string.Empty;
    public DateTime AwardedAt { get; set; }
    public int? Year { get; set; }
}

public class GameTierDto
{
    public Guid GameId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public long? IgdbId { get; set; }
    public string Tier { get; set; } = string.Empty;
}

public class GlobalContextDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double ReliabilityScore { get; set; }
    public int UnreadNotificationCount { get; set; }
    public int PendingFriendRequestCount { get; set; }
}

public class UserProfileAggregateDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double ReliabilityScore { get; set; }
    public int CoOpHours { get; set; }
    public DateTime CreatedAt { get; set; }
    
    public List<UserAwardDto> TopAwards { get; set; } = [];
    public List<GameTierDto> RecentTiers { get; set; } = [];
    public string FriendshipStatus { get; set; } = "NONE";
}
