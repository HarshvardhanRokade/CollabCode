namespace CollabCode.API.Models;

public class RoomParticipant
{
    public int Id { get; set; }
    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Role { get; set; } = "Editor"; // Owner, Editor, Viewer
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}