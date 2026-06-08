using System.Security.Claims;
using CollabCode.API.DTOs;
using CollabCode.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabCode.API.Controllers;

[ApiController]
[Route("api/rooms/{roomId}/snapshots")]
[Authorize]
public class SnapshotsController : ControllerBase
{
    private readonly SnapshotService _snapshotService;

    public SnapshotsController(SnapshotService snapshotService)
    {
        _snapshotService = snapshotService;
    }

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/rooms/{roomId}/snapshots
    [HttpGet]
    public async Task<IActionResult> GetSnapshots(Guid roomId)
    {
        var snapshots = await _snapshotService.GetSnapshotsAsync(roomId, GetUserId());
        if (snapshots == null) return NotFound();
        return Ok(snapshots);
    }

    // POST /api/rooms/{roomId}/snapshots
    [HttpPost]
    public async Task<IActionResult> CreateSnapshot(Guid roomId, CreateSnapshotDto dto)
    {
        var snapshot = await _snapshotService.CreateSnapshotAsync(roomId, GetUserId(), dto);
        if (snapshot == null) return NotFound();
        return Ok(snapshot);
    }

    // GET /api/rooms/{roomId}/snapshots/{snapshotId}
    [HttpGet("{snapshotId}")]
    public async Task<IActionResult> GetSnapshot(Guid roomId, int snapshotId)
    {
        var snapshot = await _snapshotService
            .GetSnapshotByIdAsync(roomId, snapshotId, GetUserId());
        if (snapshot == null) return NotFound();
        return Ok(snapshot);
    }

    // POST /api/rooms/{roomId}/snapshots/{snapshotId}/restore
    [HttpPost("{snapshotId}/restore")]
    public async Task<IActionResult> RestoreSnapshot(Guid roomId, int snapshotId)
    {
        var success = await _snapshotService
            .RestoreSnapshotAsync(roomId, snapshotId, GetUserId());
        if (!success) return NotFound();
        return Ok(new { message = "Snapshot restored successfully." });
    }
}