using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConwayGameOfLife.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMeteorScores : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MeteorScores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Score = table.Column<int>(type: "INTEGER", nullable: false),
                    Locks = table.Column<int>(type: "INTEGER", nullable: false),
                    PlacedCellTotal = table.Column<int>(type: "INTEGER", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeteorScores", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MeteorScores_Score",
                table: "MeteorScores",
                column: "Score");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MeteorScores");
        }
    }
}
