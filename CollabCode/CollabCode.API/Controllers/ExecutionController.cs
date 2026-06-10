using CollabCode.API.DTOs;
using CollabCode.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabCode.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExecutionController : ControllerBase
{
    private readonly ExecutionService _executionService;

    public ExecutionController(ExecutionService executionService)
    {
        _executionService = executionService;
    }

    [HttpPost("run")]
    public async Task<IActionResult> RunCode(ExecutionRequestDto dto)
    {
        // Rate limiting handled by AspNetCoreRateLimit middleware
        // Max 5 requests per minute per IP (configured in appsettings.json)
        if (string.IsNullOrWhiteSpace(dto.Code))
            return BadRequest(new { message = "Code cannot be empty." });

        var result = await _executionService.ExecuteAsync(dto);
        return Ok(result);
    }
}