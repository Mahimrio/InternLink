using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class JobRepository : Repository<Job>, IJobRepository
{
    public JobRepository(ApplicationDbContext db) : base(db)
    {
    }

    public async Task<IReadOnlyList<Job>> GetApprovedOpenJobsAsync(string? locationTypeFilter, string? keyword, CancellationToken ct = default)
    {
        var query = Set
            .Include(j => j.JobSkills)
            .AsNoTracking()
            .Where(j => j.IsApproved && !j.IsClosed);

        if (!string.IsNullOrWhiteSpace(locationTypeFilter)
            && Enum.TryParse<LocationType>(locationTypeFilter, ignoreCase: true, out var locationType))
        {
            query = query.Where(j => j.LocationType == locationType);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var kw = keyword.ToLowerInvariant();
            query = query.Where(j =>
                j.Title.ToLower().Contains(kw)
                || j.CoreDescription.ToLower().Contains(kw)
                || j.SelectionCriteria.ToLower().Contains(kw));
        }

        return await query.ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Job>> GetByCompanyAsync(Guid companyId, CancellationToken ct = default)
    {
        return await Set
            .AsNoTracking()
            .Where(j => j.CompanyId == companyId)
            .ToListAsync(ct);
    }
}
