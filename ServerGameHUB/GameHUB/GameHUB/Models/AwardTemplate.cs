namespace GameHUB.Models;

public class AwardTemplate
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? IconUrl { get; set; }
    public bool IsCustom { get; set; }
}