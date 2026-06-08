namespace CollabCode.API.DTOs;

public class ExecutionRequestDto
{
    public string Code { get; set; } = string.Empty;
    public string Language { get; set; } = "javascript";
    public string Input { get; set; } = string.Empty; // stdin input
}

public class ExecutionResponseDto
{
    public string Output { get; set; } = string.Empty;
    public string Error { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public double ExecutionTime { get; set; }
    public int MemoryUsed { get; set; }
}