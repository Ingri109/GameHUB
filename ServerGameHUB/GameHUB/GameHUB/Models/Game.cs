namespace GameHUB.Models;

public class Game
{
    public Guid Id { get; set; }
    public required string Title { get; set; }
    public string? CoverUrl { get; set; }
    public int MinPlayers { get; set; }
    public int MaxPlayers { get; set; }
    public string? DiscordApplicationId { get; set; }
    public long? IgdbId { get; set; }

    public ICollection<Session> Sessions { get; set; } = [];
}