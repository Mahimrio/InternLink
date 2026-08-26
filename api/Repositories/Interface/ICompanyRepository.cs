using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface ICompanyRepository : IRepository<Company>
{
    Task<Company?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
}
