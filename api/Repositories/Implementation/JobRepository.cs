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

    public async Task<(IReadOnlyList<Job> Items, int TotalCount)> SearchApprovedOpenJobsAsync(
        string? locationTypeFilter,
        string? keyword,
        IReadOnlyCollection<Guid>? relevantSkillIds,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var query = Set
            .Include(j => j.Company)
            .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
            .AsNoTracking()
            .Where(j => j.IsApproved && !j.IsClosed && j.DeadLine >= now);

        if (!string.IsNullOrWhiteSpace(locationTypeFilter)
            && Enum.TryParse<LocationType>(locationTypeFilter, ignoreCase: true, out var locationType))
        {
            query = query.Where(j => j.LocationType == locationType);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var pattern = $"%{keyword.Trim()}%";
            query = query.Where(j =>
                EF.Functions.ILike(j.Title, pattern)
                || EF.Functions.ILike(j.CoreDescription, pattern));
        }

        if (relevantSkillIds is not null)
        {
            if (relevantSkillIds.Count == 0)
            {
                return (Array.Empty<Job>(), 0);
            }

            query = query.Where(j => j.JobSkills.Any(js => relevantSkillIds.Contains(js.SkillId)));
        }

        var totalCount = await query.CountAsync(ct);

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 20 : (pageSize > 100 ? 100 : pageSize);

        var items = await query
            .OrderBy(j => j.DeadLine)
            .ThenByDescending(j => j.Id)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<Job?> GetApprovedOpenJobByIdAsync(Guid jobId, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        return await Set
            .Include(j => j.Company)
            .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == jobId && j.IsApproved && !j.IsClosed && j.DeadLine >= now, ct);
    }

    public async Task<IReadOnlyList<Job>> GetApprovedOpenJobsAsync(string? locationTypeFilter, string? keyword, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var query = Set
            .Include(j => j.Company)
            .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
            .AsNoTracking()
            .Where(j => j.IsApproved && !j.IsClosed && j.DeadLine >= now);

        if (!string.IsNullOrWhiteSpace(locationTypeFilter)
            && Enum.TryParse<LocationType>(locationTypeFilter, ignoreCase: true, out var locationType))
        {
            query = query.Where(j => j.LocationType == locationType);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var pattern = $"%{keyword.Trim()}%";
            query = query.Where(j =>
                EF.Functions.ILike(j.Title, pattern)
                || EF.Functions.ILike(j.CoreDescription, pattern));
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

    public async Task<(IReadOnlyList<Job> Items, int TotalCount)> GetPagedByCompanyAsync(
        Guid companyId, int page, int pageSize, CancellationToken ct = default)
    {
        var query = Set
            .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
            .AsNoTracking()
            .Where(j => j.CompanyId == companyId);

        var totalCount = await query.CountAsync(ct);

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 20 : (pageSize > 100 ? 100 : pageSize);

        var items = await query
            .OrderByDescending(j => j.DeadLine)
            .ThenByDescending(j => j.Id)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<Job?> GetTrackedByIdWithSkillsAsync(Guid jobId, CancellationToken ct = default)
    {
        return await Set
            .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct);
    }

    public async Task<Job?> GetByIdWithSkillsAsync(Guid jobId, CancellationToken ct = default)
    {
        return await Set
            .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == jobId, ct);
    }

    public async Task<(IReadOnlyList<Job> Items, int TotalCount)> GetPagedByApprovalAsync(
        bool approved, int page, int pageSize, CancellationToken ct = default)
    {
        var query = Set
            .Include(j => j.Company)
            .AsNoTracking()
            .Where(j => j.IsApproved == approved);

        var totalCount = await query.CountAsync(ct);

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 20 : (pageSize > 100 ? 100 : pageSize);

        var items = await query
            .OrderByDescending(j => j.DeadLine)
            .ThenByDescending(j => j.Id)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }
}
