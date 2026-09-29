namespace GameHUB.DTOs;

public class FriendResponseDto
{
    public Guid UserId { get; set; }
    public required string Username { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public required string DiscordNickname { get; set; }
    public string? AvatarUrl { get; set; }
    public required string Status { get; set; }
}