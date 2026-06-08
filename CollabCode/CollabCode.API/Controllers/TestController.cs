using Microsoft.AspNetCore.Mvc;

namespace CollabCode.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new { message = "CollabCode API is running! 🚀" });
    }
}