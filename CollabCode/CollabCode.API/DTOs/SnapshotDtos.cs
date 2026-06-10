using System.ComponentModel.DataAnnotations;

namespace CollabCode.API.DTOs;

public class CreateSnapshotDto
{
    [MaxLength(200, ErrorMessage = "Snapshot message cannot exceed 200 characters")]
    public string Message { get; set; } = string.Empty;
}

public class SnapshotResponseDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string SavedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}