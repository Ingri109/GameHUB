using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameHUB.Migrations
{
    /// <inheritdoc />
    public partial class IgdbAndTierUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Tier",
                table: "UserGameTiers",
                type: "text",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<long>(
                name: "IgdbId",
                table: "Games",
                type: "bigint",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IgdbId",
                table: "Games");

            migrationBuilder.AlterColumn<int>(
                name: "Tier",
                table: "UserGameTiers",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
