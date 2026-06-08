namespace CollabCode.API.DTOs;

public class CreateRoomDto
{
    public string Name { get; set; } = string.Empty;
    public string Language { get; set; } = "javascript";
    public bool IsPublic { get; set; } = false;
}

public class UpdateRoomDto
{
    public string Name { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
}

public class RoomResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Language { get; set; } = string.Empty;
    public string CurrentCode { get; set; } = string.Empty;
    public bool IsPublic { get; set; }
    public DateTime CreatedAt { get; set; }
    public string OwnerName { get; set; } = string.Empty;
    public int ParticipantCount { get; set; }
}

public class ParticipantDto
{
    public Guid UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime JoinedAt { get; set; }
}