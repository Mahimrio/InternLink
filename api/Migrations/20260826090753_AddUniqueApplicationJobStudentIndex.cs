using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternLinkApi.Migrations
{
    /// <inheritdoc />
    public partial class AddUniqueApplicationJobStudentIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Applications_JobId",
                table: "Applications");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_JobId_StudentId",
                table: "Applications",
                columns: new[] { "JobId", "StudentId" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Applications_JobId_StudentId",
                table: "Applications");

            migrationBuilder.CreateIndex(
                name: "IX_Applications_JobId",
                table: "Applications",
                column: "JobId");
        }
    }
}
