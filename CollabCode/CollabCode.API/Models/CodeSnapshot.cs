namespace CollabCode.API.Models;

public class CodeSnapshot
{
    public int Id { get; set; }
    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public Guid SavedBy { get; set; }
    public User User { get; set; } = null!;
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}