using InternLinkApi.DTOs;

namespace InternLinkApi.Services.AdminService;

public interface IAdminJobService
{
    Task<PagedResultDto<AdminJobDto>> GetJobsAsync(bool approved, int page, int pageSize, CancellationToken ct = default);

    Task ApproveAsync(Guid adminId, Guid jobId, CancellationToken ct = default);

    // ── External job management ──────────────────────────────────────────────

    /// <summary>
    /// Triggers the full external ingestion pipeline on demand.
    /// Returns a summary of what was ingested, skipped, and failed.
    /// </summary>
    Task<ExternalJobSyncResultDto> SyncExternalJobsAsync(Guid adminId, CancellationToken ct = default);

    /// <summary>
    /// Manually creates a single external job posting (bypasses automatic sync).
    /// Useful for one-off additions from portals not yet covered by the pipeline.
    /// </summary>
    Task<AdminJobDto> CreateExternalJobAsync(Guid adminId, CreateExternalJobRequestDto dto, CancellationToken ct = default);

    /// <summary>
    /// Uses the AI to extract structured job fields from raw pasted text.
    /// Returns a prefilled DTO for the admin to review before saving.
    /// </summary>
    Task<ParseExternalJobResponseDto> ParseExternalJobWithAiAsync(Guid adminId, ParseExternalJobRequestDto dto, CancellationToken ct = default);
}
