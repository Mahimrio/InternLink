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
}
