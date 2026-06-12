using System.Collections.Concurrent;
using CollabCode.API.Data;
using CollabCode.API.Models; // Required for RoomParticipant
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

    private static readonly ConcurrentDictionary<string, List<Operation>>
        _roomOperations = new();

    private static readonly ConcurrentDictionary<string, System.Timers.Timer>
        _saveTimers = new();

    private static readonly ConcurrentDictionary<string, string>
        _pendingCode = new();

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

        // Auto-add user as participant if not already
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

        // Initialize operations list for this room if not exists
        _roomOperations.TryAdd(roomId, new List<Operation>());

        // Send current code to the user who just joined
        var roomData = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == Guid.Parse(roomId));
        if (roomData != null)
        {
            await Clients.Caller.SendAsync("InitialCode", roomData.CurrentCode, roomData.Language);
        }

        await Clients.OthersInGroup(roomId).SendAsync(
            "UserJoined", userName, Context.UserIdentifier);

        await BroadcastRoomUsers(roomId);
    }

    public async Task LeaveRoom(string roomId)
    {
        await HandleLeave(roomId);
    }

    // Called when a user types something
    public async Task SendOperation(string roomId, Operation operation)
    {
        var ops = _roomOperations.GetOrAdd(roomId, _ => new List<Operation>());

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

        // Apply operation to get new code
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == Guid.Parse(roomId));
        if (room != null)
        {
            var newCode = _ot.Apply(room.CurrentCode, transformed);

            // Store latest code for debounced save
            _pendingCode[roomId] = newCode;

            // Debounce — reset timer on every keystroke
            ScheduleSave(roomId);
        }

        // Broadcast to others immediately (don't wait for DB save)
        await Clients.OthersInGroup(roomId).SendAsync(
            "ReceiveOperation", transformed, Context.UserIdentifier);
    }

    public async Task SendCursorPosition(string roomId, object position)
    {
        var userName = Context.User?.Identity?.Name ?? "Anonymous";
        await Clients.OthersInGroup(roomId).SendAsync(
            "ReceiveCursorPosition", position, Context.UserIdentifier, userName);
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

        // Check if room is now empty
        var usersStillInRoom = _connections
            .Any(c => c.Value.RoomId == roomId);

        // Clean up timer if room is empty
        if (!usersStillInRoom)
        {
            if (_saveTimers.TryRemove(roomId, out var timer))
            {
                timer.Stop();
                timer.Dispose();
            }
            _pendingCode.TryRemove(roomId, out _);
            _roomOperations.TryRemove(roomId, out _);
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

    private void ScheduleSave(string roomId)
    {
        // Cancel existing timer if any
        if (_saveTimers.TryGetValue(roomId, out var existingTimer))
        {
            existingTimer.Stop();
            existingTimer.Dispose();
        }

        // Create new 3 second timer
        var timer = new System.Timers.Timer(3000);
        timer.AutoReset = false; // only fire once

        timer.Elapsed += async (sender, e) =>
        {
            try
            {
                if (_pendingCode.TryGetValue(roomId, out var code))
                {
                    // Create a new DB context scope for the timer callback
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                    var room = await db.Rooms
                        .FirstOrDefaultAsync(r => r.Id == Guid.Parse(roomId));

                    if (room != null)
                    {
                        room.CurrentCode = code;
                        await db.SaveChangesAsync();
                        _pendingCode.TryRemove(roomId, out _);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Debounced save error: {ex.Message}");
            }
        };

        timer.Start();
        _saveTimers[roomId] = timer;
    }

    public async Task SendLanguageChange(string roomId, string language)
    {
        // Save to DB
        var room = await _db.Rooms
            .FirstOrDefaultAsync(r => r.Id == Guid.Parse(roomId));

        if (room != null)
        {
            room.Language = language;
            await _db.SaveChangesAsync();
        }

        // Broadcast to others
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
}