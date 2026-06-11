using CollabCode.API.Data;
using CollabCode.API.DTOs;
using CollabCode.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollabCode.API.Services;

public class RoomService
{
    private readonly AppDbContext _db;

    public RoomService(AppDbContext db)
    {
        _db = db;
    }

    // Get all rooms the user owns or participates in
    public async Task<PaginatedRoomsDto> GetMyRoomsAsync(Guid userId, int page, int pageSize)
    {
        var query = _db.Rooms
            .Include(r => r.Owner)
            .Include(r => r.Participants)
            .Where(r => r.CreatedBy == userId ||
                        r.Participants.Any(p => p.UserId == userId))
            .OrderByDescending(r => r.CreatedAt);

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var rooms = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PaginatedRoomsDto
        {
            Rooms = rooms.Select(MapToDto).ToList(),
            TotalCount = totalCount,
            TotalPages = totalPages,
            CurrentPage = page,
            PageSize = pageSize,
            HasNextPage = page < totalPages,
            HasPreviousPage = page > 1
        };
    }

    // Get a single room by ID
    public async Task<RoomResponseDto?> GetRoomByIdAsync(Guid roomId, Guid userId)
    {
        var room = await _db.Rooms
            .Include(r => r.Owner)
            .Include(r => r.Participants)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null) return null;

        // Only allow access if owner, participant, or room is public
        var hasAccess = room.CreatedBy == userId ||
                        room.Participants.Any(p => p.UserId == userId) ||
                        room.IsPublic;

        return hasAccess ? MapToDto(room) : null;
    }

    // Create a new room
    public async Task<RoomResponseDto> CreateRoomAsync(CreateRoomDto dto, Guid userId)
    {
        var room = new Room
        {
            Id = Guid.NewGuid(),
            Name = dto.Name,
            Language = dto.Language,
            IsPublic = dto.IsPublic,
            CreatedBy = userId,
            CurrentCode = $"// Welcome to {dto.Name}!\n"
        };

        _db.Rooms.Add(room);

        // Automatically add creator as Owner participant
        var participant = new RoomParticipant
        {
            RoomId = room.Id,
            UserId = userId,
            Role = "Owner"
        };

        _db.RoomParticipants.Add(participant);
        await _db.SaveChangesAsync();

        // Reload with Owner info for the response
        var created = await _db.Rooms
            .Include(r => r.Owner)
            .Include(r => r.Participants)
            .FirstAsync(r => r.Id == room.Id);

        return MapToDto(created);
    }

    // Update room settings
    public async Task<RoomResponseDto?> UpdateRoomAsync(Guid roomId, UpdateRoomDto dto, Guid userId)
    {
        var room = await _db.Rooms
            .Include(r => r.Owner)
            .Include(r => r.Participants)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null || room.CreatedBy != userId) return null;

        room.Name = dto.Name;
        room.Language = dto.Language;
        room.IsPublic = dto.IsPublic;

        await _db.SaveChangesAsync();
        return MapToDto(room);
    }

    // Delete a room (only owner can do this)
    public async Task<bool> DeleteRoomAsync(Guid roomId, Guid userId)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null || room.CreatedBy != userId) return false;

        _db.Rooms.Remove(room);
        await _db.SaveChangesAsync();
        return true;
    }

    // Join a public room
    public async Task<bool> JoinRoomAsync(Guid roomId, Guid userId)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId);
        if (room == null || !room.IsPublic) return false;

        // Check if already a participant
        var already = await _db.RoomParticipants
            .AnyAsync(p => p.RoomId == roomId && p.UserId == userId);
        if (already) return true;

        _db.RoomParticipants.Add(new RoomParticipant
        {
            RoomId = roomId,
            UserId = userId,
            Role = "Editor"
        });

        await _db.SaveChangesAsync();
        return true;
    }

    // Get all participants of a room
    public async Task<List<ParticipantDto>?> GetParticipantsAsync(Guid roomId, Guid userId)
    {
        var room = await _db.Rooms
            .Include(r => r.Participants)
                .ThenInclude(p => p.User)
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null) return null;

        var hasAccess = room.CreatedBy == userId ||
                        room.Participants.Any(p => p.UserId == userId) ||
                        room.IsPublic;

        if (!hasAccess) return null;

        return room.Participants.Select(p => new ParticipantDto
        {
            UserId = p.UserId,
            UserName = p.User.UserName,
            Role = p.Role,
            JoinedAt = p.JoinedAt
        }).ToList();
    }

    // Helper to map Room → RoomResponseDto
    private static RoomResponseDto MapToDto(Room room) => new()
    {
        Id = room.Id,
        Name = room.Name,
        Language = room.Language,
        CurrentCode = room.CurrentCode,
        IsPublic = room.IsPublic,
        CreatedAt = room.CreatedAt,
        OwnerName = room.Owner?.UserName ?? "Unknown",
        ParticipantCount = room.Participants.Count
    };
}