using System.ComponentModel.DataAnnotations;

namespace GameHUB.Models;

public class Session
{
    public Guid Id { get; set; }

    [MaxLength(50)]
    public string Name { get; set; } = string.Empty;
    public Guid GameId { get; set; }
    public Game? Game { get; set; }

    public Guid? HostId { get; set; }
    public User? Host { get; set; }

    public SessionStatus Status { get; set; } = SessionStatus.GATHERING;
    public DateTime? ScheduledFor { get; set; }
    public DateTime? StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public bool IsPrivate { get; set; }
    public int? PlayerLimit { get; set; }

    public string InviteToken { get; set; } = Guid.NewGuid().ToString("N");

    public ICollection<SessionParticipant> Participants { get; set; } = [];
    public ICollection<UserAward> Awards { get; set; } = [];
}