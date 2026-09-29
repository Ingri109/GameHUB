using GameHUB.DTOs;
using GameHUB.Extensions;
using GameHUB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameHUB.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Захищаємо маршрут токеном
public class FriendshipController : ControllerBase
{
    private readonly IFriendshipService _friendshipService;

    public FriendshipController(IFriendshipService friendshipService)
    {
        _friendshipService = friendshipService;
    }

    [HttpPost("request/{userId}")]
    public async Task<IActionResult> SendRequestPath(Guid userId)
    {
        try
        {
            var currentUserId = User.GetUserId();
            await _friendshipService.SendRequestAsync(currentUserId, userId);
            return Ok(new { message = "Запит надіслано" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("reject/{requestId}")]
    public async Task<IActionResult> RejectRequestPath(Guid requestId)
    {
        try
        {
            var currentUserId = User.GetUserId();
            await _friendshipService.RejectRequestAsync(currentUserId, requestId);
            return Ok(new { message = "Запит відхилено" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> RemoveFriend(Guid userId)
    {
        try
        {
            var currentUserId = User.GetUserId();
            await _friendshipService.RemoveFriendAsync(currentUserId, userId);
            return Ok(new { message = "Користувача видалено з друзів" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests()
    {
        var currentUserId = User.GetUserId();
        var (incoming, outgoing) = await _friendshipService.GetFriendRequestsAsync(currentUserId);
        return Ok(new { incoming, outgoing });
    }

    [HttpPost("accept/{requestId}")]
    public async Task<IActionResult> AcceptRequest(Guid requestId)
    {
        try
        {
            var currentUserId = User.GetUserId();
            await _friendshipService.AcceptRequestAsync(currentUserId, requestId);
            return Ok(new { message = "Запит прийнято" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetFriends([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var currentUserId = User.GetUserId();
        var (friends, totalCount) = await _friendshipService.GetFriendsPaginatedAsync(currentUserId, page, pageSize);
        return Ok(new { friends, totalCount, page, pageSize });
    }
}