using System.Security.Claims;
using CollabCode.API.DTOs;
using CollabCode.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabCode.API.Controllers;

[ApiController]
[Route("api/rooms/{roomId}/files")]
[Authorize]
public class FilesController : ControllerBase
{
    private readonly FileService _fileService;

    public FilesController(FileService fileService) => _fileService = fileService;

    [HttpGet]
    public async Task<IActionResult> GetFiles(Guid roomId)
    {
        var files = await _fileService.GetFilesAsync(roomId);
        return Ok(files);
    }

    [HttpPost]
    public async Task<IActionResult> CreateFile(Guid roomId, CreateFileDto dto)
    {
        var file = await _fileService.CreateFileAsync(roomId, dto);
        if (file == null) return NotFound();
        return Ok(file);
    }

    [HttpDelete("{fileId}")]
    public async Task<IActionResult> DeleteFile(Guid roomId, Guid fileId)
    {
        var success = await _fileService.DeleteFileAsync(roomId, fileId);
        if (!success) return BadRequest(new { message = "Cannot delete the only file." });
        return NoContent();
    }

    [HttpPut("{fileId}/rename")]
    public async Task<IActionResult> RenameFile(Guid roomId, Guid fileId, RenameFileDto dto)
    {
        var success = await _fileService.RenameFileAsync(roomId, fileId, dto);
        if (!success) return NotFound();
        return Ok(new { message = "Renamed." });
    }

    [HttpPost("{fileId}/entry-point")]
    public async Task<IActionResult> SetEntryPoint(Guid roomId, Guid fileId)
    {
        var success = await _fileService.SetEntryPointAsync(roomId, fileId);
        if (!success) return NotFound();
        return Ok(new { message = "Entry point updated." });
    }

    [HttpPut("{fileId}/content")]
    public async Task<IActionResult> UpdateContent(Guid roomId, Guid fileId, [FromBody] UpdateFileContentDto dto)
    {
        var success = await _fileService.UpdateFileContentAsync(roomId, fileId, dto.Content);
        if (!success) return NotFound();
        return Ok();
    }
}