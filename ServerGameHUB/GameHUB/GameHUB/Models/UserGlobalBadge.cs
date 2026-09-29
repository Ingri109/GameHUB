namespace GameHUB.Models;

public class UserGlobalBadge
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public required string BadgeName { get; set; }
    public DateTime AwardedAt { get; set; } = DateTime.UtcNow;
    public int? Year { get; set; }
}