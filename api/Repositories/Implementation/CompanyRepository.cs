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

    public async Task<(IReadOnlyList<Company> Items, int TotalCount)> GetPagedByStatusAsync(
        Models.Enums.VerificationStatus? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = Set
            .Include(c => c.User)
            .AsNoTracking()
            .AsQueryable();

        if (status.HasValue)
        {
            query = query.Where(c => c.VerificationStatus == status.Value);
        }

        var totalCount = await query.CountAsync(ct);

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 20 : (pageSize > 100 ? 100 : pageSize);

        var items = await query
            .OrderByDescending(c => c.User.CreatedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
