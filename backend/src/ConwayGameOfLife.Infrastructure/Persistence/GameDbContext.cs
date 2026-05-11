using Microsoft.EntityFrameworkCore;

namespace ConwayGameOfLife.Infrastructure.Persistence;

public sealed class GameDbContext(DbContextOptions<GameDbContext> options) : DbContext(options)
{
    public DbSet<GameBoardEntity> Boards => Set<GameBoardEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<GameBoardEntity>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.StateJson).IsRequired();
            entity.Property(e => e.UpdatedAtUtc).IsRequired();
        });
    }
}
