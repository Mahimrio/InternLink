using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class ApplicationRepository : Repository<Application>, IApplicationRepository
{
    public ApplicationRepository(ApplicationDbContext db) : base(db)
    {
    }

    public async Task<IReadOnlyList<Application>> GetByStudentAsync(Guid studentId, CancellationToken ct = default)
    {
        return await Set
            .AsNoTracking()
            .Where(a => a.StudentId == studentId)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Application>> GetByStatusAsync(Guid companyId, ApplicationStatus? status, CancellationToken ct = default)
    {
        var query = Set
            .AsNoTracking()
            .Where(a => a.Job.CompanyId == companyId);

        if (status.HasValue)
        {
            query = query.Where(a => a.ApplicationStatus == status.Value);
        }

        return await query.ToListAsync(ct);
    }

    public async Task<HashSet<Guid>> GetAppliedJobIdsForStudentAsync(Guid studentId, CancellationToken ct = default)
    {
        var jobIds = await Set
            .AsNoTracking()
            .Where(a => a.StudentId == studentId)
            .Select(a => a.JobId)
            .ToListAsync(ct);

        return jobIds.ToHashSet();
    }

    public async Task<bool> ExistsAsync(Guid jobId, Guid studentId, CancellationToken ct = default)
    {
        return await Set
            .AnyAsync(a => a.JobId == jobId && a.StudentId == studentId, ct);
    }

    public async Task<IReadOnlyList<Application>> GetStudentApplicationsWithDetailsAsync(
        Guid studentId, ApplicationStatus? status, CancellationToken ct = default)
    {
        var query = Set
            .Include(a => a.Job)
                .ThenInclude(j => j.Company)
            .Include(a => a.AttachedResume)
            .AsNoTracking()
            .Where(a => a.StudentId == studentId);

        if (status.HasValue)
        {
            query = query.Where(a => a.ApplicationStatus == status.Value);
        }

        return await query
            .OrderByDescending(a => a.SubmittedAt)
            .ToListAsync(ct);
    }

    public async Task<(IReadOnlyList<Application> Items, int TotalCount)> GetCompanyApplicationsAsync(
        Guid companyId, Guid? jobId, ApplicationStatus? status, int page, int pageSize, CancellationToken ct = default)
    {
        var query = Set
            .Include(a => a.Job)
            .Include(a => a.Student)
            .AsNoTracking()
            .Where(a => a.Job.CompanyId == companyId);

        if (jobId.HasValue)
        {
            query = query.Where(a => a.JobId == jobId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(a => a.ApplicationStatus == status.Value);
        }

        var totalCount = await query.CountAsync(ct);

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 20 : (pageSize > 100 ? 100 : pageSize);

        var items = await query
            .OrderByDescending(a => a.SubmittedAt)
            .ThenByDescending(a => a.Id)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<Application?> GetCompanyApplicationDetailAsync(
        Guid companyId, Guid applicationId, CancellationToken ct = default)
    {
        return await Set
            .Include(a => a.Job)
            .Include(a => a.Student)
            .Include(a => a.AttachedResume)
            .Include(a => a.Interviews)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.Job.CompanyId == companyId, ct);
    }

    public async Task<Application?> GetTrackedCompanyApplicationAsync(
        Guid companyId, Guid applicationId, CancellationToken ct = default)
    {
        return await Set
            .Include(a => a.Job)
            .Include(a => a.Student)
            .FirstOrDefaultAsync(a => a.Id == applicationId && a.Job.CompanyId == companyId, ct);
    }
}
