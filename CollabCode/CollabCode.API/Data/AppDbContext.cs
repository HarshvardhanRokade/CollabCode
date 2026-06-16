using CollabCode.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollabCode.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        // All queries are NoTracking by default — faster reads
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomParticipant> RoomParticipants => Set<RoomParticipant>();
    public DbSet<CodeSnapshot> CodeSnapshots => Set<CodeSnapshot>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<CodeFile> CodeFiles => Set<CodeFile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Room>()
            .HasOne(r => r.Owner)
            .WithMany(u => u.OwnedRooms)
            .HasForeignKey(r => r.CreatedBy)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RoomParticipant>()
            .HasOne(rp => rp.Room)
            .WithMany(r => r.Participants)
            .HasForeignKey(rp => rp.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RoomParticipant>()
            .HasOne(rp => rp.User)
            .WithMany(u => u.Participations)
            .HasForeignKey(rp => rp.UserId)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<CodeSnapshot>()
            .HasOne(cs => cs.Room)
            .WithMany(r => r.Snapshots)
            .HasForeignKey(cs => cs.RoomId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CodeSnapshot>()
            .HasOne(cs => cs.User)
            .WithMany(u => u.Snapshots)
            .HasForeignKey(cs => cs.SavedBy)
            .OnDelete(DeleteBehavior.NoAction);

        modelBuilder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<CodeFile>()
            .HasOne(f => f.Room)
            .WithMany(r => r.Files)
            .HasForeignKey(f => f.RoomId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}