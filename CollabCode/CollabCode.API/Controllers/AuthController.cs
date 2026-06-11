using CollabCode.API.DTOs;
using CollabCode.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CollabCode.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthService _authService;
    private readonly IConfiguration _config;

    public AuthController(AuthService authService, IConfiguration config)
    {
        _authService = authService;
        _config = config;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);
        if (result == null)
            return Unauthorized(new { message = "Invalid email or password." });

        // Set httpOnly cookies for production
        SetAuthCookies(result.Token, result.RefreshToken);

        // Also return in body for development
        return Ok(new
        {
            token = result.Token,
            refreshToken = result.RefreshToken,
            userName = result.UserName,
            userId = result.UserId
        });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var result = await _authService.RegisterAsync(dto);
        if (result == null)
            return BadRequest(new { message = "Email already in use." });

        SetAuthCookies(result.Token, result.RefreshToken);

        return Ok(new
        {
            token = result.Token,
            refreshToken = result.RefreshToken,
            userName = result.UserName,
            userId = result.UserId
        });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        var refreshToken = Request.Cookies["refreshToken"]
            ?? Request.Headers["X-Refresh-Token"].FirstOrDefault();

        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { message = "No refresh token found." });

        var result = await _authService.RefreshAsync(refreshToken);
        if (result == null)
            return Unauthorized(new { message = "Invalid or expired refresh token." });

        SetAuthCookies(result.Token, result.RefreshToken);

        return Ok(new
        {
            token = result.Token,
            refreshToken = result.RefreshToken,
            userName = result.UserName,
            userId = result.UserId
        });
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        if (!string.IsNullOrEmpty(refreshToken))
            await _authService.RevokeRefreshTokenAsync(refreshToken);

        // Clear cookies
        Response.Cookies.Delete("accessToken");
        Response.Cookies.Delete("refreshToken");

        return Ok(new { message = "Logged out successfully." });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
        // Frontend can call this to check if still logged in
        var userName = User.Identity?.Name;
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        return Ok(new { userName, userId });
    }

    // ── Private Helper ────────────────────────────
    private void SetAuthCookies(string accessToken, string refreshToken)
    {
        Response.Cookies.Append("accessToken", accessToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,          // ← false for dev
            SameSite = SameSiteMode.Lax, // ← Lax not Strict
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddMinutes(15)
        });

        Response.Cookies.Append("refreshToken", refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = false,          // ← false for dev
            SameSite = SameSiteMode.Lax, // ← Lax not Strict
            Path = "/",
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });
    }

    [HttpGet("token")]
    [Authorize]
    public IActionResult GetToken()
    {
        // Returns the token from cookie for SignalR use
        var token = Request.Cookies["accessToken"];
        return Ok(new { token });
    }
}