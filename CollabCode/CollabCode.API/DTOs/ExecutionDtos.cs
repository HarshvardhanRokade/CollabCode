using System.ComponentModel.DataAnnotations;

namespace CollabCode.API.DTOs;

public class ExecutionRequestDto
{
    [Required(ErrorMessage = "Code is required")]
    [MaxLength(50000, ErrorMessage = "Code cannot exceed 50,000 characters")]
    public string Code { get; set; } = string.Empty;

    [Required(ErrorMessage = "Language is required")]
    [RegularExpression("^(javascript|typescript|python|java|csharp|cpp|go|rust)$",
        ErrorMessage = "Invalid language")]
    public string Language { get; set; } = "javascript";

    [MaxLength(10000, ErrorMessage = "Input cannot exceed 10,000 characters")]
    public string Input { get; set; } = string.Empty;
}

public class ExecutionResponseDto
{
    public string Output { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double ExecutionTime { get; set; }
    public int MemoryUsed { get; set; }
}