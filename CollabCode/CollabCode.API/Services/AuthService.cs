using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
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
        // Check if email already exists
        var exists = await _db.Users.AnyAsync(u => u.Email == dto.Email);
        if (exists) return null;

        // Create new user with hashed password
        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = dto.UserName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password)
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            UserName = user.UserName,
            UserId = user.Id
        };
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginDto dto)
    {
        // Find user by email
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null) return null;

        // Verify password against stored hash
        var validPassword = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
        if (!validPassword) return null;

        return new AuthResponseDto
        {
            Token = GenerateToken(user),
            UserName = user.UserName,
            UserId = user.Id
        };
    }

    private string GenerateToken(User user)
    {
        // Claims are pieces of info stored inside the token
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.UserName),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var secret = _config["JwtSettings:Secret"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddDays(
            int.Parse(_config["JwtSettings:ExpiryDays"]!)
        );

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}