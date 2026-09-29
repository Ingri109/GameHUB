using GameHUB.Models;

namespace GameHUB.DTOs;

public class ScheduleBlockDto
{
    public DateOnly Date { get; set; }
    public ScheduleBlockType BlockType { get; set; }
    public ScheduleStatus Status { get; set; }
    public TimeSpan? ExactStartTime { get; set; }
    public TimeSpan? ExactEndTime { get; set; }
}

public class UpdateScheduleRequest
{
    public required List<ScheduleBlockDto> Blocks { get; set; }
}

public class UserScheduleResponse
{
    public Guid UserId { get; set; }
    public required List<ScheduleBlockDto> Blocks { get; set; }
}
