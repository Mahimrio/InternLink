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
}
