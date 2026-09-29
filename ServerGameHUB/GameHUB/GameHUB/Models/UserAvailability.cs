using System.ComponentModel.DataAnnotations;

namespace GameHUB.Models;

public class UserAvailability
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; } = null!;

    [Range(1, 7)]
    public int DayOfWeek { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
}