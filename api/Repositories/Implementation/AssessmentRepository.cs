using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class AssessmentRepository : IAssessmentRepository
{
    private readonly ApplicationDbContext _context;

    public AssessmentRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IReadOnlyList<Assessment>> GetByStudentIdAsync(Guid studentId, CancellationToken ct = default)
    {
        return await _context.Assessments
            .AsNoTracking()
            .Include(a => a.Skill)
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.EarnedDate)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Assessment>> GetByStudentAndSkillAsync(Guid studentId, Guid skillId, CancellationToken ct = default)
    {
        return await _context.Assessments
            .AsNoTracking()
            .Include(a => a.Skill)
            .Where(a => a.StudentId == studentId && a.SkillId == skillId)
            .OrderByDescending(a => a.EarnedDate)
            .ToListAsync(ct);
    }

    public async Task<Dictionary<Guid, int>> GetBestScoresForStudentAsync(Guid studentId, CancellationToken ct = default)
    {
        return await _context.Assessments
            .AsNoTracking()
            .Where(a => a.StudentId == studentId)
            .GroupBy(a => a.SkillId)
            .Select(g => new { SkillId = g.Key, MaxScore = g.Max(a => a.AchievedScore) })
            .ToDictionaryAsync(x => x.SkillId, x => x.MaxScore, ct);
    }

    public async Task<HashSet<Guid>> GetVerifiedSkillIdsForStudentAsync(Guid studentId, CancellationToken ct = default)
    {
        var ids = await _context.Assessments
            .AsNoTracking()
            .Where(a => a.StudentId == studentId && a.AchievedScore >= 70)
            .Select(a => a.SkillId)
            .Distinct()
            .ToListAsync(ct);

        return [.. ids];
    }

    public async Task<IReadOnlyList<string>> GetVerifiedSkillNamesForStudentAsync(Guid studentId, CancellationToken ct = default)
    {
        return await _context.Assessments
            .AsNoTracking()
            .Where(a => a.StudentId == studentId && a.AchievedScore >= 70)
            .Select(a => a.Skill.SkillName)
            .Distinct()
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Skill>> GetAllSkillsAsync(CancellationToken ct = default)
    {
        return await _context.Skills
            .AsNoTracking()
            .OrderBy(s => s.DomainClassification)
            .ThenBy(s => s.SkillName)
            .ToListAsync(ct);
    }

    public async Task<Skill?> GetSkillByIdAsync(Guid skillId, CancellationToken ct = default)
    {
        return await _context.Skills
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == skillId, ct);
    }

    public async Task<Skill?> GetSkillByNameAsync(string skillName, CancellationToken ct = default)
    {
        return await _context.Skills
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.SkillName.ToLower() == skillName.ToLower(), ct);
    }

    public async Task AddAssessmentAsync(Assessment assessment, CancellationToken ct = default)
    {
        await _context.Assessments.AddAsync(assessment, ct);
    }

    public async Task EnsureStudentSkillLinkedAsync(Guid studentId, Guid skillId, int proficiency, CancellationToken ct = default)
    {
        var existing = await _context.StudentSkills
            .FirstOrDefaultAsync(ss => ss.StudentId == studentId && ss.SkillId == skillId, ct);

        if (existing == null)
        {
            await _context.StudentSkills.AddAsync(new StudentSkill
            {
                StudentId = studentId,
                SkillId = skillId,
                ProficiencyLevel = Math.Clamp(proficiency, 1, 5)
            }, ct);
        }
        else if (existing.ProficiencyLevel < proficiency)
        {
            existing.ProficiencyLevel = Math.Clamp(proficiency, 1, 5);
        }
    }

    // Recommendation/ATS-side verified-skill lookups (company feature).
    public async Task<IReadOnlyList<string>> GetVerifiedSkillNamesAsync(
        Guid studentId, int minScore, CancellationToken ct = default)
    {
        return await _context.Assessments
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

        var rows = await _context.Assessments
            .AsNoTracking()
            .Where(a => studentIds.Contains(a.StudentId) && a.AchievedScore >= minScore)
            .GroupBy(a => a.StudentId)
            .Select(g => new { StudentId = g.Key, Count = g.Select(x => x.SkillId).Distinct().Count() })
            .ToListAsync(ct);

        return rows.ToDictionary(r => r.StudentId, r => r.Count);
    }

    public async Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        return await _context.SaveChangesAsync(ct);
    }
}
