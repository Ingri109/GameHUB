using System;
using System.ComponentModel.DataAnnotations;

namespace GameHUB.Models;

public enum NotificationType 
{
    PostSessionReview,
    SessionInvite
}

public class UserNotification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User? User { get; set; }
    
    public NotificationType Type { get; set; }
    
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public bool IsResolved { get; set; } = false;
    
    public Guid? ReferenceId { get; set; } // e.g. SessionId
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
