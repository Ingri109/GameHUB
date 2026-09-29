using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GameHUB.Models;
using Microsoft.IdentityModel.Tokens;

namespace GameHUB.Services;

public class TokenService : ITokenService
{
    public string CreateToken(User user)
    {
        var secretKey = Environment.GetEnvironmentVariable("JWT_SECRET") 
                        ?? throw new InvalidOperationException("JWT_SECRET is missing");
            
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));

        // Дані, які будуть "зашиті" всередині токена
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Name, user.Username),
            new Claim("discord_id", user.DiscordId)
        };

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7), // Токен діє 7 днів
            SigningCredentials = creds,
            Issuer = Environment.GetEnvironmentVariable("JWT_ISSUER"),
            Audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE")
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}