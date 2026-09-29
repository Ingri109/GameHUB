using GameHUB.DTOs;

namespace GameHUB.Services;

public interface IAuthService
{
    Task<AuthResponseDto>LoginWithDiscordAsync(DiscordLoginDto dto);
}