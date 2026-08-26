using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface ICompanyRepository : IRepository<Company>
{
    Task<Company?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);

    // Admin moderation view: companies filtered by verification status, with contact user included.
    Task<(IReadOnlyList<Company> Items, int TotalCount)> GetPagedByStatusAsync(
        Models.Enums.VerificationStatus? status, int page, int pageSize, CancellationToken ct = default);
}
