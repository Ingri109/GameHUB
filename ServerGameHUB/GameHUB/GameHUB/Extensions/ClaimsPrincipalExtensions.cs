using System.Security.Claims;

namespace GameHUB.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetUserId(this ClaimsPrincipal user)
    {
        var idClaim = user.FindFirst(ClaimTypes.NameIdentifier) ?? user.FindFirst("sub");
        return Guid.TryParse(idClaim?.Value, out var userId) ? userId : Guid.Empty;
    }
}