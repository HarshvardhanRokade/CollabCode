using System.Security.Claims;
using CollabCode.API.DTOs;
using CollabCode.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabCode.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // ← ALL endpoints in this controller require a valid JWT
public class RoomsController : ControllerBase
{
    private readonly RoomService _roomService;

    public RoomsController(RoomService roomService)
    {
        _roomService = roomService;
    }

    // Helper to extract userId from the JWT token
    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetMyRooms(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 9,
    [FromQuery] string? search = null,
    [FromQuery] string? language = null)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 50) pageSize = 9;

        var result = await _roomService.GetMyRoomsAsync(
            GetUserId(), page, pageSize, search, language);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetRoom(Guid id)
    {
        var room = await _roomService.GetRoomByIdAsync(id, GetUserId());
        if (room == null) return NotFound();
        return Ok(room);
    }

    [HttpPost]
    public async Task<IActionResult> CreateRoom(CreateRoomDto dto)
    {
        var room = await _roomService.CreateRoomAsync(dto, GetUserId());
        return CreatedAtAction(nameof(GetRoom), new { id = room.Id }, room);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRoom(Guid id, UpdateRoomDto dto)
    {
        var room = await _roomService.UpdateRoomAsync(id, dto, GetUserId());
        if (room == null) return NotFound();
        return Ok(room);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRoom(Guid id)
    {
        var success = await _roomService.DeleteRoomAsync(id, GetUserId());
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpGet("trash")]
    public async Task<IActionResult> GetTrash()
    {
        var rooms = await _roomService.GetDeletedRoomsAsync(GetUserId());
        return Ok(rooms);
    }

    [HttpPost("{id}/restore")]
    public async Task<IActionResult> RestoreRoom(Guid id)
    {
        var success = await _roomService.RestoreRoomAsync(id, GetUserId());
        if (!success) return NotFound();
        return Ok(new { message = "Room restored." });
    }

    [HttpDelete("{id}/permanent")]
    public async Task<IActionResult> PermanentDelete(Guid id)
    {
        var success = await _roomService.PermanentlyDeleteRoomAsync(id, GetUserId());
        if (!success) return NotFound();
        return NoContent();
    }

    [HttpPost("{id}/join")]
    public async Task<IActionResult> JoinRoom(Guid id)
    {
        var success = await _roomService.JoinRoomAsync(id, GetUserId());
        if (!success) return BadRequest(new { message = "Room not found or is private." });
        return Ok(new { message = "Joined successfully." });
    }

    [HttpGet("{id}/participants")]
    public async Task<IActionResult> GetParticipants(Guid id)
    {
        var participants = await _roomService.GetParticipantsAsync(id, GetUserId());
        if (participants == null) return NotFound();
        return Ok(participants);
    }
}