using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;

namespace GameHUB.Models;

public enum ScheduleStatus
{
    DefaultOrUnavailable = 0,
    Maybe = 1,
    WillBeThere = 2
}

public enum ScheduleBlockType
{
    Block_09_12 = 1,
    Block_13_16 = 2,
    Block_17_20 = 3,
    Block_21_23 = 4,
    Block_00_03 = 5
}

[Index(nameof(UserId), nameof(Date))]
public class ScheduleBlock
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; } = null!;

    public DateOnly Date { get; set; }
    public ScheduleBlockType BlockType { get; set; }
    public ScheduleStatus Status { get; set; }

    public TimeSpan? ExactStartTime { get; set; }
    public TimeSpan? ExactEndTime { get; set; }
}
