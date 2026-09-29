using GameHUB.Models;

namespace GameHUB.Services;

public interface ITokenService
{
    string CreateToken(User user);
}