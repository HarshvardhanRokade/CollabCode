using Microsoft.EntityFrameworkCore.Infrastructure;

namespace CollabCode.API.Models;

public class User
{
    public Guid Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Room> OwnedRooms { get; set; } = new List<Room>();
    public ICollection<RoomParticipant> Participations { get; set; } = new List<RoomParticipant>();
    public ICollection<CodeSnapshot> Snapshots { get; set; } = new List<CodeSnapshot>();

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}