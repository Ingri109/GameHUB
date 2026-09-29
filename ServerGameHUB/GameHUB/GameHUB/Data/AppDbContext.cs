using Microsoft.EntityFrameworkCore;
using GameHUB.Models;

namespace GameHUB.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Game> Games { get; set; }
    public DbSet<UserGameTier> UserGameTiers { get; set; }
    public DbSet<UserAvailability> UserAvailabilities { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<SessionParticipant> SessionParticipants { get; set; }
    public DbSet<AwardTemplate> AwardTemplates { get; set; }
    public DbSet<UserAward> UserAwards { get; set; }
    public DbSet<UserGlobalBadge> UserGlobalBadges { get; set; }
    public DbSet<Friendship> Friendships { get; set; }
    public DbSet<UserNotification> UserNotifications { get; set; }
    public DbSet<ScheduleBlock> ScheduleBlocks { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Унікальність DiscordId
        modelBuilder.Entity<User>()
            .HasIndex(u => u.DiscordId)
            .IsUnique();

        // Композитний ключ для Tier-листів
        modelBuilder.Entity<UserGameTier>()
            .HasKey(ugt => new { ugt.UserId, ugt.GameId });

        modelBuilder.Entity<UserGameTier>()
            .Property(ugt => ugt.Tier)
            .HasConversion<string>();

        // Композитний ключ для учасників сесії
        modelBuilder.Entity<SessionParticipant>()
            .HasKey(sp => new { sp.SessionId, sp.UserId });

        // Налаштування зв'язків для UserAward (щоб уникнути каскадних циклів)
        modelBuilder.Entity<UserAward>()
            .HasOne(ua => ua.Receiver)
            .WithMany()
            .HasForeignKey(ua => ua.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<UserAward>()
            .HasOne(ua => ua.Giver)
            .WithMany()
            .HasForeignKey(ua => ua.GiverId)
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<Session>()
            .HasOne(s => s.Host)
            .WithMany(u => u.HostedSessions)
            .HasForeignKey(s => s.HostId)
            .OnDelete(DeleteBehavior.SetNull);
        
        modelBuilder.Entity<Friendship>()
            .HasKey(f => new { f.RequesterId, f.AddresseeId }); 

        modelBuilder.Entity<Friendship>()
            .HasOne(f => f.Requester)
            .WithMany()
            .HasForeignKey(f => f.RequesterId)
            .OnDelete(DeleteBehavior.Restrict); 

        modelBuilder.Entity<Friendship>()
            .HasOne(f => f.Addressee)
            .WithMany()
            .HasForeignKey(f => f.AddresseeId)
            .OnDelete(DeleteBehavior.Restrict);
        
        modelBuilder.Entity<UserAvailability>()
            .HasOne(ua => ua.User)
            .WithMany(u => u.Availabilities)
            .HasForeignKey(ua => ua.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ScheduleBlock>()
            .HasIndex(sb => new { sb.UserId, sb.Date, sb.BlockType })
            .IsUnique();

        modelBuilder.Entity<ScheduleBlock>()
            .HasOne(sb => sb.User)
            .WithMany(u => u.ScheduleBlocks)
            .HasForeignKey(sb => sb.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
