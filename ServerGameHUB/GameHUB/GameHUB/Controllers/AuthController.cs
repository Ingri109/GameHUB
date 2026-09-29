using GameHUB.DTOs;
using GameHUB.Extensions;
using GameHUB.Repositories;
using GameHUB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameHUB.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        Response.Cookies.Append("token", "", new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // or Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") != "Development"
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddYears(-1)
        });
        
        return Ok(new { message = "Logged out successfully" });
    }

    private readonly IAuthService _authService;
    private readonly IUserRepository _userRepository;

    public AuthController(IAuthService authService, IUserRepository userRepository)
    {
        _authService = authService;
        _userRepository = userRepository;
    }

    // ЗМІНА 1: Роут тепер "discord-callback" (збігається з Next.js)
    [HttpPost("discord-callback")]
    public async Task<IActionResult> HandleDiscordCallback([FromBody] DiscordLoginDto dto)
    {
        var result = await _authService.LoginWithDiscordAsync(dto);
        return Ok(result);
    }
    
    // ЗМІНА 2: Роут тепер "me" (збігається із запитом відновлення сесії у Zustand)
    [HttpGet("me")]
    [Authorize] 
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.GetUserId(); 
        var user = await _userRepository.GetByIdAsync(userId);
    
        if (user == null)
            return NotFound("Користувача не знайдено.");

        var userProfile = new UserProfileDto
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName,
            AvatarUrl = user.AvatarUrl,
            ReliabilityScore = user.ReliabilityScore,
            CreatedAt = user.CreatedAt
        };

        return Ok(userProfile);
    }
    
    // ЗМІНА 3: Змінено назву методу, щоб уникнути дублювання
    [HttpGet("discord-login")]
    public IActionResult RedirectToDiscord()
    {
        var clientId = Environment.GetEnvironmentVariable("DISCORD_CLIENT_ID");
        var redirectUri = "http://localhost:3000/auth/callback"; 
        var scope = "identify email"; 
    
        var discordAuthUrl = $"https://discord.com/api/oauth2/authorize?client_id={clientId}&redirect_uri={Uri.EscapeDataString(redirectUri)}&response_type=code&scope={Uri.EscapeDataString(scope)}";
    
        return Redirect(discordAuthUrl);
    }
}