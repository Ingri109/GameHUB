using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GameHUB.Migrations
{
    /// <inheritdoc />
    public partial class AddHasReviewedToParticipant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasReviewed",
                table: "SessionParticipants",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasReviewed",
                table: "SessionParticipants");
        }
    }
}
