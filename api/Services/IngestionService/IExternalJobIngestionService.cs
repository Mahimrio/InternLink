using InternLinkApi.DTOs;

namespace InternLinkApi.Services.IngestionService;

/// <summary>
/// Queries configured external job portals, deduplicates, and persists new postings.
/// All implementations must be idempotent — running twice must not create duplicate rows.
/// </summary>
public interface IExternalJobIngestionService
{
    /// <summary>
    /// Queries all configured sources and ingests new jobs.
    /// Returns a summary of what happened (new, skipped, failed counts).
    /// This method is called both by the background scheduler and admin-triggered manual syncs.
    /// </summary>
    Task<ExternalJobSyncResultDto> SyncAllSourcesAsync(CancellationToken ct = default);
}
