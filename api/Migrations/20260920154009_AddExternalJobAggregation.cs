using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InternLinkApi.Migrations
{
    /// <inheritdoc />
    public partial class AddExternalJobAggregation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "CompanyId",
                table: "Jobs",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "CompanyNameSnapshot",
                table: "Jobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalApplyUrl",
                table: "Jobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalJobId",
                table: "Jobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalSourceName",
                table: "Jobs",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTimeOffset>(
                name: "LastSyncedAt",
                table: "Jobs",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Source",
                table: "Jobs",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_Source",
                table: "Jobs",
                column: "Source");

            migrationBuilder.CreateIndex(
                name: "IX_Jobs_ExternalSourceName_ExternalJobId",
                table: "Jobs",
                columns: new[] { "ExternalSourceName", "ExternalJobId" },
                unique: true,
                filter: "\"ExternalSourceName\" IS NOT NULL AND \"ExternalJobId\" IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Jobs_Source",
                table: "Jobs");

            migrationBuilder.DropIndex(
                name: "IX_Jobs_ExternalSourceName_ExternalJobId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "CompanyNameSnapshot",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ExternalApplyUrl",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ExternalJobId",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "ExternalSourceName",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "LastSyncedAt",
                table: "Jobs");

            migrationBuilder.DropColumn(
                name: "Source",
                table: "Jobs");

            migrationBuilder.AlterColumn<Guid>(
                name: "CompanyId",
                table: "Jobs",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }
    }
}
