using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class ResumeRepository : Repository<Resume>, IResumeRepository
{
    public ResumeRepository(ApplicationDbContext db) : base(db)
    {
    }

    public async Task<Resume?> GetByIdAndStudentIdAsync(Guid resumeId, Guid studentId, CancellationToken ct = default)
    {
        return await Set
            .Include(r => r.Student)
            .FirstOrDefaultAsync(r => r.Id == resumeId && r.StudentId == studentId, ct);
    }

    public async Task<IReadOnlyList<Resume>> GetByStudentIdAsync(Guid studentId, CancellationToken ct = default)
    {
        return await Set
            .AsNoTracking()
            .Where(r => r.StudentId == studentId)
            .OrderByDescending(r => r.LastModified)
            .ToListAsync(ct);
    }
}
