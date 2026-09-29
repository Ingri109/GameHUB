using System.Security.Claims;
using GameHUB.DTOs;
using GameHUB.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GameHUB.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ScheduleController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public ScheduleController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    private Guid GetUserId()
    {
        return Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    }

    [HttpGet("my")]
    public async Task<IActionResult> GetMySchedule()
    {
        var userId = GetUserId();
        var schedule = await _scheduleService.GetUserScheduleAsync(userId);
        return Ok(schedule);
    }

    [HttpGet("friends")]
    public async Task<IActionResult> GetFriendsSchedules()
    {
        var userId = GetUserId();
        var schedules = await _scheduleService.GetFriendsSchedulesAsync(userId);
        return Ok(schedules);
    }

    [HttpPost("my")]
    [HttpPut("my")]
    public async Task<IActionResult> UpdateMySchedule([FromBody] UpdateScheduleRequest request)
    {
        if (request == null || request.Blocks == null)
            return BadRequest("Invalid request.");

        var userId = GetUserId();
        await _scheduleService.UpdateScheduleAsync(userId, request);
        
        return Ok(new { message = "Schedule updated successfully." });
    }
}
