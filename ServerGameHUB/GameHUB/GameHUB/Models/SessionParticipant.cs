namespace GameHUB.Models;

public class SessionParticipant
{
    public Guid SessionId { get; set; }
    public Session? Session { get; set; }

    public Guid UserId { get; set; }
    public User? User { get; set; }

    public ParticipantStatus Status { get; set; } = ParticipantStatus.INVITED;
    public DateTime? JoinedAt { get; set; }
    public DateTime? LeftAt { get; set; }
    public bool HasReviewed { get; set; } = false;
}