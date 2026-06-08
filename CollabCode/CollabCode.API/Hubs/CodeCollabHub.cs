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

    // tracks connectionId → (roomId, userName)
    private static readonly ConcurrentDictionary<string, (string RoomId, string UserName)>
        _connections = new();

    // tracks roomId → list of recent operations for OT
    private static readonly ConcurrentDictionary<string, List<Operation>>
        _roomOperations = new();

    public CodeCollabHub(AppDbContext db, OTService ot)
    {
        _db = db;
        _ot = ot;
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
            // Transform against any concurrent operations
            var concurrent = ops.Where(o =>
                o.Version >= operation.Version &&
                o.UserId != operation.UserId).ToList();

            foreach (var concurrentOp in concurrent)
                transformed = _ot.Transform(transformed, concurrentOp);

            transformed.Version = ops.Count;
            ops.Add(transformed);

            // Keep only last 100 operations to save memory
            if (ops.Count > 100)
                ops.RemoveAt(0);
        }

        // Apply to the room's current code in DB (debounced — every operation)
        var room = await _db.Rooms.FirstOrDefaultAsync(r => r.Id == Guid.Parse(roomId));
        if (room != null)
        {
            room.CurrentCode = _ot.Apply(room.CurrentCode, transformed);
            await _db.SaveChangesAsync();
        }

        // Broadcast transformed operation to others
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
}