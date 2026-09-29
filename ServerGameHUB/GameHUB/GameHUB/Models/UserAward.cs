namespace GameHUB.Models;

public class UserAward
{
    public Guid Id { get; set; }
    
    public Guid SessionId { get; set; }
    public Session? Session { get; set; }

    public Guid ReceiverId { get; set; }
    public User? Receiver { get; set; }

    public Guid GiverId { get; set; }
    public User? Giver { get; set; }

    public Guid? AwardTemplateId { get; set; }
    public AwardTemplate? AwardTemplate { get; set; }

    public string? CustomTitle { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}