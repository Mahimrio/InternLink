using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class CompanyRepository : Repository<Company>, ICompanyRepository
{
    public CompanyRepository(ApplicationDbContext db) : base(db)
    {
    }

    public async Task<Company?> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await Set.FirstOrDefaultAsync(c => c.UserId == userId, ct);
    }
}
