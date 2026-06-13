using System.Collections.Concurrent;
using CollabCode.API.Data;
using CollabCode.API.Models;
using CollabCode.API.Services;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CollabCode.API.Hubs;

public class CodeCollabHub : Hub
{
    private readonly AppDbContext _db;
    private readonly OTService _ot;
    private readonly IServiceProvider _serviceProvider;

    private static readonly ConcurrentDictionary<string, (string RoomId, string UserName)>
        _connections = new();

    // key = "roomId:fileId"
    private static readonly ConcurrentDictionary<string, List<Operation>>
        _fileOperations = new();

    private static readonly ConcurrentDictionary<string, System.Timers.Timer>
        _saveTimers = new();

    private static readonly ConcurrentDictionary<string, string>
        _pendingFileCode = new();

    public CodeCollabHub(AppDbContext db, OTService ot, IServiceProvider serviceProvider)
    {
        _db = db;
        _ot = ot;
        _serviceProvider = serviceProvider;
    }

    public async Task JoinRoom(string roomId)
    {
        var userName = Context.User?.Identity?.Name ?? "Anonymous";
        var connectionId = Context.ConnectionId;

        if (Guid.TryParse(roomId, out var roomGuid))
        {
            var userIdStr = Context.UserIdentifier;
            if (Guid.TryParse(userIdStr, out var userGuid))
            {
                var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomGuid);
                if (room != null)
                {
                    var alreadyParticipant = await _db.RoomParticipants
                        .AnyAsync(p => p.RoomId == roomGuid && p.UserId == userGuid);

                    if (!alreadyParticipant)
                    {
                        _db.RoomParticipants.Add(new RoomParticipant
                        {
                            RoomId = roomGuid,
                            UserId = userGuid,
                            Role = "Editor"
                        });
                        await _db.SaveChangesAsync();
                    }
                }
            }
        }

        await Groups.AddToGroupAsync(connectionId, roomId);
        _connections[connectionId] = (roomId, userName);

        // Load files for this room (auto-creates default file if none exist)
        var files = await _db.CodeFiles
            .Where(f => f.RoomId == roomGuid)
            .OrderBy(f => f.Order)
            .ToListAsync();

        if (files.Count == 0)
        {
            var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == roomGuid);
            var defaultFile = new CodeFile
            {
                Id = Guid.NewGuid(),
                RoomId = roomGuid,
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

        await Clients.Caller.SendAsync("InitialFiles", files.Select(f => new
        {
            id = f.Id,
            name = f.Name,
            language = f.Language,
            content = f.Content,
            isEntryPoint = f.IsEntryPoint
        }));

        await Clients.OthersInGroup(roomId).SendAsync(
            "UserJoined", userName, Context.UserIdentifier);

        await BroadcastRoomUsers(roomId);
    }

    public async Task LeaveRoom(string roomId)
    {
        await HandleLeave(roomId);
    }

    public async Task SendOperation(string roomId, string fileId, Operation operation)
    {
        var key = $"{roomId}:{fileId}";
        var ops = _fileOperations.GetOrAdd(key, _ => new List<Operation>());

        Operation transformed = operation;

        lock (ops)
        {
            var concurrent = ops.Where(o =>
                o.Version >= operation.Version &&
                o.UserId != operation.UserId).ToList();

            foreach (var concurrentOp in concurrent)
                transformed = _ot.Transform(transformed, concurrentOp);

            transformed.Version = ops.Count;
            ops.Add(transformed);

            if (ops.Count > 100)
                ops.RemoveAt(0);
        }

        var file = await _db.CodeFiles.FirstOrDefaultAsync(f => f.Id == Guid.Parse(fileId));
        if (file != null)
        {
            var newCode = _ot.Apply(file.Content, transformed);
            _pendingFileCode[key] = newCode;
            ScheduleFileSave(key, fileId);
        }

        await Clients.OthersInGroup(roomId).SendAsync(
            "ReceiveOperation", fileId, transformed, Context.UserIdentifier);
    }

    public async Task SendCursorPosition(string roomId, object position)
    {
        var userName = Context.User?.Identity?.Name ?? "Anonymous";
        await Clients.OthersInGroup(roomId).SendAsync(
            "ReceiveCursorPosition", position, Context.UserIdentifier, userName);
    }

    public async Task SendFileCreated(string roomId, object file)
    {
        await Clients.OthersInGroup(roomId).SendAsync("FileCreated", file);
    }

    public async Task SendFileDeleted(string roomId, string fileId)
    {
        await Clients.OthersInGroup(roomId).SendAsync("FileDeleted", fileId);
    }

    public async Task SendFileRenamed(string roomId, string fileId, string newName)
    {
        await Clients.OthersInGroup(roomId).SendAsync("FileRenamed", fileId, newName);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (_connections.TryRemove(Context.ConnectionId, out var info))
            await HandleLeave(info.RoomId);

        await base.OnDisconnectedAsync(exception);
    }

    private async Task HandleLeave(string roomId)
    {
        var userName = Context.User?.Identity?.Name ?? "Anonymous";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
        _connections.TryRemove(Context.ConnectionId, out _);

        var usersStillInRoom = _connections
            .Any(c => c.Value.RoomId == roomId);

        if (!usersStillInRoom)
        {
            // Clean up all file timers/operations for this room
            var keysToRemove = _saveTimers.Keys
                .Where(k => k.StartsWith(roomId + ":"))
                .ToList();

            foreach (var key in keysToRemove)
            {
                if (_saveTimers.TryRemove(key, out var timer))
                {
                    timer.Stop();
                    timer.Dispose();
                }
                _pendingFileCode.TryRemove(key, out _);
                _fileOperations.TryRemove(key, out _);
            }
        }

        await Clients.OthersInGroup(roomId).SendAsync(
            "UserLeft", userName, Context.UserIdentifier);

        await BroadcastRoomUsers(roomId);
    }

    private async Task BroadcastRoomUsers(string roomId)
    {
        var usersInRoom = _connections
            .Where(c => c.Value.RoomId == roomId)
            .Select(c => c.Value.UserName)
            .Distinct()
            .ToList();

        await Clients.Group(roomId).SendAsync("RoomUsersUpdated", usersInRoom);
    }

    private void ScheduleFileSave(string key, string fileId)
    {
        if (_saveTimers.TryGetValue(key, out var existingTimer))
        {
            existingTimer.Stop();
            existingTimer.Dispose();
        }

        var timer = new System.Timers.Timer(3000) { AutoReset = false };

        timer.Elapsed += async (sender, e) =>
        {
            try
            {
                if (_pendingFileCode.TryGetValue(key, out var code))
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var file = await db.CodeFiles
                        .FirstOrDefaultAsync(f => f.Id == Guid.Parse(fileId));

                    if (file != null)
                    {
                        file.Content = code;
                        await db.SaveChangesAsync();
                        _pendingFileCode.TryRemove(key, out _);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Debounced file save error: {ex.Message}");
            }
        };

        timer.Start();
        _saveTimers[key] = timer;
    }

    public async Task SendLanguageChange(string roomId, string language)
    {
        var room = await _db.Rooms
            .FirstOrDefaultAsync(r => r.Id == Guid.Parse(roomId));

        if (room != null)
        {
            room.Language = language;
            await _db.SaveChangesAsync();
        }

        await Clients.OthersInGroup(roomId).SendAsync(
            "ReceiveLanguageChange", language);
    }

    public async Task SendChatMessage(string roomId, string message)
    {
        var userName = Context.User?.Identity?.Name ?? "Anonymous";

        await Clients.Group(roomId).SendAsync(
            "ReceiveChatMessage",
            userName,
            message,
            DateTime.UtcNow.ToString("HH:mm")
        );
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
}