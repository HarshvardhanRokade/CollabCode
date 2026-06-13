namespace CollabCode.API.Models;

public class CodeFile
{
    public Guid Id { get; set; }
    public Guid RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public string Name { get; set; } = string.Empty;       // "index.js"
    public string Language { get; set; } = "javascript";
    public string Content { get; set; } = string.Empty;
    public bool IsEntryPoint { get; set; } = false;        // main file to run
    public int Order { get; set; } = 0;                     // tab order
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}