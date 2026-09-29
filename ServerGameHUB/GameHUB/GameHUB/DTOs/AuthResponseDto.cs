namespace GameHUB.DTOs;

public class AuthResponseDto
{
    public required string Token { get; set; } // Внутрішній JWT-токен сесії
    public UserProfileDto User { get; set; } = null!;
}

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public double ReliabilityScore { get; set; }
    public DateTime CreatedAt { get; set; }
}