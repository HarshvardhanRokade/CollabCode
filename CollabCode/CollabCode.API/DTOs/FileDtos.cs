using System.ComponentModel.DataAnnotations;

namespace CollabCode.API.DTOs;

public class CreateFileDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public string Language { get; set; } = "javascript";
}

public class RenameFileDto
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;
}

public class FileResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsEntryPoint { get; set; }
    public int Order { get; set; }
}