namespace GameHUB.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public required string DiscordId { get; set; }
    public required string Username { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double ReliabilityScore { get; set; } = 100.0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public ICollection<UserGameTier> Tiers { get; set; } = [];
    public ICollection<UserAvailability> Availabilities { get; set; } = [];
    public ICollection<ScheduleBlock> ScheduleBlocks { get; set; } = [];
    public ICollection<Session> HostedSessions { get; set; } = [];
    public ICollection<SessionParticipant> ParticipatedSessions { get; set; } = [];
}