namespace GameHUB.Models;

public class Friendship
{
    public Guid RequesterId { get; set; }
    public User? Requester { get; set; }

    public Guid AddresseeId { get; set; }
    public User? Addressee { get; set; }

    // Можна використати Enum: PENDING, ACCEPTED, BLOCKED
    public string Status { get; set; } = "PENDING"; 
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}