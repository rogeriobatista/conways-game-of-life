using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Infrastructure.Persistence;

public sealed class GameDbContext(DbContextOptions<GameDbContext> options) : DbContext(options)
{
    public DbSet<GameBoardEntity> Boards => Set<GameBoardEntity>();

    public DbSet<MeteorScoreEntity> MeteorScores => Set<MeteorScoreEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameBoardEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StateJson).IsRequired();
            entity.Property(e => e.UpdatedAtUtc).IsRequired();
        });

        modelBuilder.Entity<MeteorScoreEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Score).IsRequired();
            entity.Property(e => e.Locks).IsRequired();
            entity.Property(e => e.PlacedCellTotal).IsRequired();
            entity.Property(e => e.CreatedAtUtc).IsRequired();
            entity.HasIndex(e => e.Score);
        });
    }
}
