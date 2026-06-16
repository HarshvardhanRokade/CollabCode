using CollabCode.API.Data;
using CollabCode.API.DTOs;
using CollabCode.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollabCode.API.Services;

public class FileService
{
    private readonly AppDbContext _db;

    public FileService(AppDbContext db) => _db = db;

    public async Task<List<FileResponseDto>> GetFilesAsync(Guid roomId)
    {
        var files = await _db.CodeFiles
            .Where(f => f.RoomId == roomId)
            .OrderBy(f => f.Order)
            .ToListAsync();

        // Ensure at least one file exists
        if (files.Count == 0)
        {
            var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId);
            var defaultFile = new CodeFile
            {
                Id = Guid.NewGuid(),
                RoomId = roomId,
                Name = GetDefaultFileName(room?.Language ?? "javascript"),
                Language = room?.Language ?? "javascript",
                Content = room?.CurrentCode ?? "",
                IsEntryPoint = true,
                Order = 0
            };
            _db.CodeFiles.Add(defaultFile);
            await _db.SaveChangesAsync();
            files.Add(defaultFile);
        }

        return files.Select(MapToDto).ToList();
    }

    public async Task<FileResponseDto?> CreateFileAsync(Guid roomId, CreateFileDto dto)
    {
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomId);
        if (room == null) return null;

        var maxOrder = await _db.CodeFiles
            .Where(f => f.RoomId == roomId)
            .Select(f => (int?)f.Order)
            .MaxAsync() ?? -1;

        var file = new CodeFile
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            Name = dto.Name,
            Language = dto.Language,
            Content = "",
            IsEntryPoint = false,
            Order = maxOrder + 1
        };

        _db.CodeFiles.Add(file);
        await _db.SaveChangesAsync();
        return MapToDto(file);
    }

    public async Task<bool> DeleteFileAsync(Guid roomId, Guid fileId)
    {
        var file = await _db.CodeFiles
            .AsTracking()
            .FirstOrDefaultAsync(f => f.Id == fileId && f.RoomId == roomId);
        if (file == null) return false;

        // Don't allow deleting the last file
        var count = await _db.CodeFiles.CountAsync(f => f.RoomId == roomId);
        if (count <= 1) return false;

        // If deleting entry point, make another file the entry point
        if (file.IsEntryPoint)
        {
            var other = await _db.CodeFiles
                .AsTracking()
                .Where(f => f.RoomId == roomId && f.Id != fileId)
                .OrderBy(f => f.Order)
                .FirstOrDefaultAsync();
            if (other != null) other.IsEntryPoint = true;
        }

        _db.CodeFiles.Remove(file);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RenameFileAsync(Guid roomId, Guid fileId, RenameFileDto dto)
    {
        var file = await _db.CodeFiles
            .AsTracking()
            .FirstOrDefaultAsync(f => f.Id == fileId && f.RoomId == roomId);
        if (file == null) return false;

        file.Name = dto.Name;
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> SetEntryPointAsync(Guid roomId, Guid fileId)
    {
        var files = await _db.CodeFiles
            .AsTracking()
            .Where(f => f.RoomId == roomId)
            .ToListAsync();
        var target = files.FirstOrDefault(f => f.Id == fileId);
        if (target == null) return false;

        foreach (var f in files) f.IsEntryPoint = (f.Id == fileId);
        await _db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateFileContentAsync(Guid roomId, Guid fileId, string content)
    {
        var file = await _db.CodeFiles
            .AsTracking()
            .FirstOrDefaultAsync(f => f.Id == fileId && f.RoomId == roomId);

        if (file == null) return false;

        file.Content = content;
        await _db.SaveChangesAsync();
        return true;
    }

    private static string GetDefaultFileName(string language) => language switch
    {
        "javascript" => "index.js",
        "typescript" => "index.ts",
        "python" => "main.py",
        "java" => "Main.java",
        "csharp" => "Program.cs",
        "cpp" => "main.cpp",
        "go" => "main.go",
        "rust" => "main.rs",
        _ => "main.txt"
    };

    private static FileResponseDto MapToDto(CodeFile f) => new()
    {
        Id = f.Id,
        Name = f.Name,
        Language = f.Language,
        Content = f.Content,
        IsEntryPoint = f.IsEntryPoint,
        Order = f.Order
    };
}