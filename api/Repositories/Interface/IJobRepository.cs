using InternLinkApi.Models;

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
}
