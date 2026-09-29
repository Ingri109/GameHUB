namespace GameHUB.Models;

public class UserGameTier
{
    public Guid UserId { get; set; }
    public User? User { get; set; }

    public Guid GameId { get; set; }
    public Game? Game { get; set; }

    public Tier Tier { get; set; }
    
}