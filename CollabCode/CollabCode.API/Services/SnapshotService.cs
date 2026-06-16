using CollabCode.API.Data;
using CollabCode.API.DTOs;
using CollabCode.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollabCode.API.Services;

public class SnapshotService
{
    private readonly AppDbContext _db;

    public SnapshotService(AppDbContext db)
    {
        _db = db;
    }

    // Save current room code as a snapshot
    public async Task<SnapshotResponseDto?> CreateSnapshotAsync(
    Guid roomId, Guid userId, CreateSnapshotDto dto)
    {
        var room = await _db.Rooms
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null) return null;

        var hasAccess = await _db.RoomParticipants
            .AnyAsync(p => p.RoomId == roomId && p.UserId == userId);

        if (!hasAccess && room.CreatedBy != userId) return null;

        // ← Get code from entry point file instead of room.CurrentCode
        var entryFile = await _db.CodeFiles
            .Where(f => f.RoomId == roomId && f.IsEntryPoint)
            .FirstOrDefaultAsync()
            ?? await _db.CodeFiles
            .Where(f => f.RoomId == roomId)
            .OrderBy(f => f.Order)
            .FirstOrDefaultAsync();

        var snapshot = new CodeSnapshot
        {
            RoomId = roomId,
            SavedBy = userId,
            Code = entryFile?.Content ?? room.CurrentCode,  // ← file content
            Language = entryFile?.Language ?? room.Language,
            Message = string.IsNullOrWhiteSpace(dto.Message)
                ? $"Snapshot at {DateTime.UtcNow:yyyy-MM-dd HH:mm}"
                : dto.Message
        };

        _db.CodeSnapshots.Add(snapshot);
        await _db.SaveChangesAsync();

        var user = await _db.Users.FindAsync(userId);
        return MapToDto(snapshot, user?.UserName ?? "Unknown");
    }

    // Get all snapshots for a room
    public async Task<List<SnapshotResponseDto>?> GetSnapshotsAsync(
        Guid roomId, Guid userId)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId);
        if (room == null) return null;

        var hasAccess = room.CreatedBy == userId ||
            await _db.RoomParticipants
                .AnyAsync(p => p.RoomId == roomId && p.UserId == userId);

        if (!hasAccess) return null;

        var snapshots = await _db.CodeSnapshots
            .Include(s => s.User)
            .Where(s => s.RoomId == roomId)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync();

        return snapshots
            .Select(s => MapToDto(s, s.User.UserName))
            .ToList();
    }

    // Get a single snapshot
    public async Task<SnapshotResponseDto?> GetSnapshotByIdAsync(
        Guid roomId, int snapshotId, Guid userId)
    {
        var snapshot = await _db.CodeSnapshots
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == snapshotId && s.RoomId == roomId);

        if (snapshot == null) return null;

        return MapToDto(snapshot, snapshot.User.UserName);
    }

    // Restore a snapshot — sets room's CurrentCode back to snapshot code
    public async Task<bool> RestoreSnapshotAsync(
    Guid roomId, int snapshotId, Guid userId)
    {
        var room = await _db.Rooms
            .AsTracking()
            .FirstOrDefaultAsync(r => r.Id == roomId);

        if (room == null || room.CreatedBy != userId) return false;

        var snapshot = await _db.CodeSnapshots
            .FirstOrDefaultAsync(s => s.Id == snapshotId && s.RoomId == roomId);

        if (snapshot == null) return false;

        // Restore to entry point file
        var entryFile = await _db.CodeFiles
            .AsTracking()
            .Where(f => f.RoomId == roomId && f.IsEntryPoint)
            .FirstOrDefaultAsync()
            ?? await _db.CodeFiles
            .AsTracking()
            .Where(f => f.RoomId == roomId)
            .OrderBy(f => f.Order)
            .FirstOrDefaultAsync();

        if (entryFile != null)
        {
            entryFile.Content = snapshot.Code;
            entryFile.Language = snapshot.Language;
        }

        // Also update room fields for backward compatibility
        room.CurrentCode = snapshot.Code;
        room.Language = snapshot.Language;

        await _db.SaveChangesAsync();
        return true;
    }

    private static SnapshotResponseDto MapToDto(CodeSnapshot s, string userName) => new()
    {
        Id = s.Id,
        Code = s.Code,
        Language = s.Language,
        Message = s.Message,
        SavedByName = userName,
        CreatedAt = s.CreatedAt
    };
}