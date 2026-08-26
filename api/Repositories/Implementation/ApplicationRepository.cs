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
}
