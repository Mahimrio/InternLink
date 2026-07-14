using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface IJobRepository : IRepository<Job>
{
    Task<IReadOnlyList<Job>> GetApprovedOpenJobsAsync(string? locationTypeFilter, string? keyword, CancellationToken ct = default);
    Task<IReadOnlyList<Job>> GetByCompanyAsync(Guid companyId, CancellationToken ct = default);
}
