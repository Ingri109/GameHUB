using System.Net.Http.Headers;
using System.Text.Json;
using GameHUB.DTOs;
using GameHUB.Models;
using GameHUB.Repositories;

namespace GameHUB.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly HttpClient _httpClient;
    private readonly ITokenService _tokenService;

    // Отримуємо репозиторій та клієнт для HTTP-запитів через конструктор
    public AuthService(IUserRepository userRepository, HttpClient httpClient, ITokenService tokenService)
    {
        _userRepository = userRepository;
        _httpClient = httpClient;
        _tokenService = tokenService;
    }
    

    public async Task<AuthResponseDto> LoginWithDiscordAsync(DiscordLoginDto dto)
    {
        // 1. Обмін коду від фронтенду на Access Token від Discord
        var discordAccessToken = await ExchangeCodeForTokenAsync(dto.Code);

        // 2. Отримання інформації профілю (ID, Username, Avatar) з Discord API
        var discordUser = await GetDiscordProfileAsync(discordAccessToken);

        // 3. Перевірка: чи є вже такий гравець у нашій базі даних?
        var user = await _userRepository.GetByDiscordIdAsync(discordUser.Id);

        // Якщо користувач заходить вперше — створюємо йому запис
        if (user == null)
        {
            user = new User
            {
                DiscordId = discordUser.Id,
                Username = discordUser.Username,
                DisplayName = !string.IsNullOrEmpty(discordUser.GlobalName) ? discordUser.GlobalName : discordUser.Username,
                AvatarUrl = discordUser.AvatarUrl
            };
            await _userRepository.CreateAsync(user);
        }
        else 
        {
            // У разі якщо ім'я в Discord змінилось, можемо оновлювати
            if (discordUser.GlobalName != null && user.DisplayName != discordUser.GlobalName)
            {
                user.DisplayName = discordUser.GlobalName;
                await _userRepository.UpdateAsync(user);
            }
        }

        // 4. Генерація внутрішнього JWT-токена сесії (поки ставимо заглушку)
        var internalToken = _tokenService.CreateToken(user);

        // Повертаємо дані назад у контролер, а він — на фронтенд
        return new AuthResponseDto
        {
            Token = internalToken,
            User = new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl,
                ReliabilityScore = user.ReliabilityScore,
                CreatedAt = user.CreatedAt
            }
        };
    }
    

    private async Task<string> ExchangeCodeForTokenAsync(string code)
    {
        var clientId = Environment.GetEnvironmentVariable("DISCORD_CLIENT_ID");
        var clientSecret = Environment.GetEnvironmentVariable("DISCORD_CLIENT_SECRET");
        var redirectUri = Environment.GetEnvironmentVariable("DISCORD_REDIRECT_URI");
        
        
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret))
        {
            throw new Exception("Ключі Discord НЕ завантажились з .env файлу! Перевір, чи лежить .env у правильній папці.");
        }
        
        if (string.IsNullOrEmpty(clientId) || string.IsNullOrEmpty(clientSecret) || string.IsNullOrEmpty(redirectUri))
        {
            throw new Exception("Ключі Discord або Redirect URI НЕ завантажились з .env файлу!");
        }

        var requestContent = new FormUrlEncodedContent(new[]
        {
            new KeyValuePair<string, string>("client_id", clientId),
            new KeyValuePair<string, string>("client_secret", clientSecret),
            new KeyValuePair<string, string>("grant_type", "authorization_code"),
            new KeyValuePair<string, string>("code", code),
            new KeyValuePair<string, string>("redirect_uri", redirectUri)
        });

        var response = await _httpClient.PostAsync("https://discord.com/api/oauth2/token", requestContent);
        
        if (!response.IsSuccessStatusCode)
        {
            var errorContent = await response.Content.ReadAsStringAsync();
            throw new Exception($"Discord API Error ({response.StatusCode}): {errorContent}");
        }

        var json = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(json);
        
        return document.RootElement.GetProperty("access_token").GetString()!;
    }

    private async Task<DiscordProfileTemp> GetDiscordProfileAsync(string accessToken)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "https://discord.com/api/users/@me");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(json);
        var root = document.RootElement;

        var id = root.GetProperty("id").GetString()!;
        var username = root.GetProperty("username").GetString()!;
        var globalName = root.TryGetProperty("global_name", out var gn) ? gn.GetString() : null;
        
        // Discord повертає лише хеш аватарки, тому ми формуємо повне посилання самі
        var avatarHash = root.GetProperty("avatar").GetString();
        var avatarUrl = string.IsNullOrEmpty(avatarHash) 
            ? null 
            : $"https://cdn.discordapp.com/avatars/{id}/{avatarHash}.png";

        return new DiscordProfileTemp
        {
            Id = id,
            Username = username,
            GlobalName = globalName,
            AvatarUrl = avatarUrl
        };
    }

    // Тимчасовий клас для парсингу відповіді від Discord
    private class DiscordProfileTemp
    {
        public required string Id { get; set; }
        public required string Username { get; set; }
        public string? GlobalName { get; set; }
        public string? AvatarUrl { get; set; }
    }
}