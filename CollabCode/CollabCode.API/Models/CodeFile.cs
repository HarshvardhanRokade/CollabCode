using System.ComponentModel.DataAnnotations;

namespace CollabCode.API.Models;

public class CodeFile
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;

    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Language { get; set; } = "javascript";

    [MaxLength(500000)] // 500KB limit
    public string Content { get; set; } = string.Empty;

    public bool IsEntryPoint { get; set; } = false;
    public int Order { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}