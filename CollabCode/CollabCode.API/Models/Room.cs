using Microsoft.EntityFrameworkCore.Infrastructure;

namespace CollabCode.API.Models;

public class Room
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Language { get; set; } = "javascript";
    public string CurrentCode { get; set; } = string.Empty;
    public bool IsPublic { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public bool IsDeleted { get; set; } = false;     
    public DateTime? DeletedAt { get; set; }

    public Guid CreatedBy { get; set; }
    public User Owner { get; set; } = null!;

    public ICollection<RoomParticipant> Participants { get; set; } = new List<RoomParticipant>();
    public ICollection<CodeSnapshot> Snapshots { get; set; } = new List<CodeSnapshot>();
}