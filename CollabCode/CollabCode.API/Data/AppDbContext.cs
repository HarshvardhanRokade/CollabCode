using CollabCode.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CollabCode.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Each DbSet = one table in the database
    public DbSet<User> Users => Set<User>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<RoomParticipant> RoomParticipants => Set<RoomParticipant>();
    public DbSet<CodeSnapshot> CodeSnapshots => Set<CodeSnapshot>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User → owns many Rooms
        modelBuilder.Entity<Room>()
            .HasOne(r => r.Owner)
            .WithMany(u => u.OwnedRooms)
            .HasForeignKey(r => r.CreatedBy)
            .OnDelete(DeleteBehavior.Cascade);

        // Room ↔ User (many-to-many via RoomParticipant)
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

        // CodeSnapshot → belongs to Room and User
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
    }
}