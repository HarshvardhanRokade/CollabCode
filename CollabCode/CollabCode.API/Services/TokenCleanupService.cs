using CollabCode.API.Data;
using Microsoft.EntityFrameworkCore;

namespace CollabCode.API.Services;

public class TokenCleanupService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<TokenCleanupService> _logger;

    // Run cleanup every 24 hours
    private readonly TimeSpan _interval = TimeSpan.FromHours(24);

    public TokenCleanupService(
        IServiceScopeFactory scopeFactory,
        ILogger<TokenCleanupService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Token Cleanup Service started.");

        // Run immediately on startup, then every 24 hours
        while (!stoppingToken.IsCancellationRequested)
        {
            await CleanupTokensAsync();
            await Task.Delay(_interval, stoppingToken);
        }
    }

    private async Task CleanupTokensAsync()
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var cutoff = DateTime.UtcNow;

            // Delete tokens that are expired OR revoked
            var deleted = await db.RefreshTokens
                .Where(rt => rt.ExpiresAt < cutoff || rt.IsRevoked)
                .ExecuteDeleteAsync();

            _logger.LogInformation(
                "Token cleanup completed. Deleted {Count} expired/revoked tokens.",
                deleted);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Token cleanup failed: {Message}", ex.Message);
        }
    }
}