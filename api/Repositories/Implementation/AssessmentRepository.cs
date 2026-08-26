using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class AssessmentRepository : Repository<Assessment>, IAssessmentRepository
{
    public AssessmentRepository(ApplicationDbContext db) : base(db)
    {
    }

    public async Task<IReadOnlyList<string>> GetVerifiedSkillNamesAsync(
        Guid studentId, int minScore, CancellationToken ct = default)
    {
        return await Set
            .AsNoTracking()
            .Where(a => a.StudentId == studentId && a.AchievedScore >= minScore)
            .Select(a => a.Skill.SkillName)
            .Distinct()
            .OrderBy(name => name)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyDictionary<Guid, int>> GetVerifiedSkillCountsAsync(
        IReadOnlyCollection<Guid> studentIds, int minScore, CancellationToken ct = default)
    {
        if (studentIds.Count == 0)
        {
            return new Dictionary<Guid, int>();
        }

        var rows = await Set
            .AsNoTracking()
            .Where(a => studentIds.Contains(a.StudentId) && a.AchievedScore >= minScore)
            .GroupBy(a => a.StudentId)
            .Select(g => new { StudentId = g.Key, Count = g.Select(x => x.SkillId).Distinct().Count() })
            .ToListAsync(ct);

        return rows.ToDictionary(r => r.StudentId, r => r.Count);
    }
}
