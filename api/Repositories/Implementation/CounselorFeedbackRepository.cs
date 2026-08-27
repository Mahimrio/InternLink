using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class CounselorFeedbackRepository : Repository<CounselorFeedback>, ICounselorFeedbackRepository
{
    public CounselorFeedbackRepository(ApplicationDbContext db) : base(db)
    {
    }

    public async Task<IReadOnlyList<CounselorFeedback>> GetFeedbackByStudentIdAsync(Guid studentId, CancellationToken ct = default)
    {
        return await Set
            .AsNoTracking()
            .Include(f => f.CounselorUser)
            .Where(f => f.StudentId == studentId)
            .OrderByDescending(f => f.MeetingDate)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<CounselorFeedback>> GetFeedbackByStudentUserIdAsync(Guid studentUserId, CancellationToken ct = default)
    {
        return await Set
            .AsNoTracking()
            .Include(f => f.CounselorUser)
            .Where(f => f.Student.UserId == studentUserId)
            .OrderByDescending(f => f.MeetingDate)
            .ToListAsync(ct);
    }
}
