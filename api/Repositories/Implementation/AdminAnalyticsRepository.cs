using InternLinkApi.Data;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class AdminAnalyticsRepository : IAdminAnalyticsRepository
{
    private readonly ApplicationDbContext _db;

    public AdminAnalyticsRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public Task<int> GetActiveStudentCountAsync(CancellationToken ct = default) =>
        _db.Students.CountAsync(s => s.User.IsActive, ct);

    public Task<int> GetActiveCompanyCountAsync(CancellationToken ct = default) =>
        _db.Companies.CountAsync(c => c.User.IsActive, ct);

    public Task<int> GetOpenJobCountAsync(CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        return _db.Jobs.CountAsync(j => j.IsApproved && !j.IsClosed && j.DeadLine >= now, ct);
    }

    public async Task<IReadOnlyDictionary<ApplicationStatus, int>> GetApplicationsByStatusAsync(CancellationToken ct = default)
    {
        var rows = await _db.Applications
            .AsNoTracking()
            .GroupBy(a => a.ApplicationStatus)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        return rows.ToDictionary(r => r.Status, r => r.Count);
    }

    public async Task<IReadOnlyList<DateTimeOffset>> GetSubmissionsSinceAsync(DateTimeOffset since, CancellationToken ct = default)
    {
        return await _db.Applications
            .AsNoTracking()
            .Where(a => a.SubmittedAt >= since)
            .Select(a => a.SubmittedAt)
            .ToListAsync(ct);
    }
}
