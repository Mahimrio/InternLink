using InternLinkApi.Models;
using InternLinkApi.Models.Enums;

namespace InternLinkApi.Repositories.Interface;

public interface IJobRepository : IRepository<Job>
{
    Task<(IReadOnlyList<Job> Items, int TotalCount)> SearchApprovedOpenJobsAsync(
        string? locationTypeFilter,
        string? keyword,
        IReadOnlyCollection<Guid>? relevantSkillIds,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<Job?> GetApprovedOpenJobByIdAsync(Guid jobId, CancellationToken ct = default);

    Task<IReadOnlyList<Job>> GetApprovedOpenJobsAsync(string? locationTypeFilter, string? keyword, CancellationToken ct = default);

    Task<IReadOnlyList<Job>> GetByCompanyAsync(Guid companyId, CancellationToken ct = default);

    // Company management view: all of the company's own jobs, any status, paginated.
    Task<(IReadOnlyList<Job> Items, int TotalCount)> GetPagedByCompanyAsync(
        Guid companyId, int page, int pageSize, CancellationToken ct = default);

    // Tracked load (with skills) for mutating a single job the company owns.
    Task<Job?> GetTrackedByIdWithSkillsAsync(Guid jobId, CancellationToken ct = default);

    // Read-only load (with skills) used to build the response after a mutation.
    Task<Job?> GetByIdWithSkillsAsync(Guid jobId, CancellationToken ct = default);

    // Admin moderation queue: all jobs filtered by approval state, with company included.
    Task<(IReadOnlyList<Job> Items, int TotalCount)> GetPagedByApprovalAsync(
        bool approved, int page, int pageSize, CancellationToken ct = default);

    // ── External job ingestion helpers ───────────────────────────────────────

    /// <summary>
    /// Returns true if a job with the given source-portal name and external ID already exists.
    /// Used by the ingestion pipeline to skip duplicates without a full SELECT.
    /// </summary>
    Task<bool> ExistsExternalJobAsync(string sourceName, string externalId, CancellationToken ct = default);
}

