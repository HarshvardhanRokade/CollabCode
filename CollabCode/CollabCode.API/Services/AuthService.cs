using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CollabCode.API.Data;
using CollabCode.API.DTOs;
using CollabCode.API.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace CollabCode.API.Services;

public class AuthService
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(AppDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto dto)
    {
        var exists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
        if (exists) return null;

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = dto.UserName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return await BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null) return null;

        var validPassword = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!validPassword) return null;

        return await BuildAuthResponse(user);
    }

    public async Task<AuthResponseDto?> RefreshAsync(string refreshToken)
    {
        // Find the refresh token in DB
        var storedToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt =>
                rt.Token == refreshToken &&
                !rt.IsRevoked &&
                rt.ExpiresAt > DateTime.UtcNow);

        if (storedToken == null) return null;

        // Revoke old refresh token
        storedToken.IsRevoked = true;
        await _db.SaveChangesAsync();

        // Issue new tokens
        return await BuildAuthResponse(storedToken.User);
    }

    public async Task RevokeRefreshTokenAsync(string refreshToken)
    {
        var token = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (token != null)
        {
            token.IsRevoked = true;
            await _db.SaveChangesAsync();
        }
    }

    // ── Private Helpers ──────────────────────────

    private async Task<AuthResponseDto> BuildAuthResponse(User user)
    {
        var jwt = GenerateJwt(user);
        var refreshToken = await GenerateRefreshToken(user.Id);

        return new AuthResponseDto
        {
            Token = jwt,
            RefreshToken = refreshToken,
            UserName = user.UserName,
            UserId = user.Id
        };
    }

    private string GenerateJwt(User user)
    {
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var secret = _config["JwtSettings:Secret"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Short expiry now — 15 minutes
        var expiry = DateTime.UtcNow.AddMinutes(
            int.Parse(_config["JwtSettings:ExpiryMinutes"] ?? "15"));

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task<string> GenerateRefreshToken(Guid userId)
    {
        // Revoke all existing refresh tokens for this user
        var existingTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();

        foreach (var t in existingTokens)
            t.IsRevoked = true;

        // Generate cryptographically secure random token
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var token = Convert.ToBase64String(randomBytes);

        var refreshToken = new RefreshToken
        {
            Token = token,
            UserId = userId,
            ExpiresAt = DateTime.UtcNow.AddDays(
                int.Parse(_config["JwtSettings:RefreshTokenExpiryDays"] ?? "7"))
        };

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return token;
    }
}