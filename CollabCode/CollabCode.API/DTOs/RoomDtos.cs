using System.ComponentModel.DataAnnotations;

namespace CollabCode.API.DTOs;

public class CreateRoomDto
{
    [Required(ErrorMessage = "Room name is required")]
    [MinLength(1, ErrorMessage = "Room name cannot be empty")]
    [MaxLength(100, ErrorMessage = "Room name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Language is required")]
    [RegularExpression("^(javascript|typescript|python|java|csharp|cpp|go|rust)$",
        ErrorMessage = "Invalid language selected")]
    public string Language { get; set; } = "javascript";

    public bool IsPublic { get; set; } = false;
}

public class UpdateRoomDto
{
    [Required(ErrorMessage = "Room name is required")]
    [MaxLength(100, ErrorMessage = "Room name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Language is required")]
    [RegularExpression("^(javascript|typescript|python|java|csharp|cpp|go|rust)$",
        ErrorMessage = "Invalid language selected")]
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

public class PaginatedRoomsDto
{
    public List<RoomResponseDto> Rooms { get; set; } = new();
    public int TotalCount { get; set; }
    public int TotalPages { get; set; }
    public int CurrentPage { get; set; }
    public int PageSize { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}