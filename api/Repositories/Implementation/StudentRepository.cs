using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class StudentRepository : Repository<Student>, IStudentRepository
{
    public StudentRepository(ApplicationDbContext db) : base(db)
    {
    }

    public async Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await Set
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);
    }

    public async Task<Student?> GetWithSkillsByUserIdAsync(Guid userId, CancellationToken ct = default)
    {
        return await Set
            .Include(s => s.StudentSkills)
                .ThenInclude(ss => ss.Skill)
            .FirstOrDefaultAsync(s => s.UserId == userId, ct);
    }

    public async Task<Student?> GetByIdWithUserAsync(Guid studentId, CancellationToken ct = default)
    {
        return await Set
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == studentId, ct);
    }

    public async Task<IReadOnlyList<CounselorStudentSummaryDto>> GetCounselorStudentSummariesAsync(string? search, CancellationToken ct = default)
    {
        var query = Set.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var trimmed = search.Trim().ToLower();
            query = query.Where(s =>
                s.FirstName.ToLower().Contains(trimmed) ||
                s.LastName.ToLower().Contains(trimmed) ||
                (s.FirstName + " " + s.LastName).ToLower().Contains(trimmed) ||
                s.Department.ToLower().Contains(trimmed) ||
                s.InstitutionalId.ToLower().Contains(trimmed));
        }

        return await query
            .OrderBy(s => s.LastName)
            .ThenBy(s => s.FirstName)
            .Select(s => new CounselorStudentSummaryDto(
                s.Id,
                (s.FirstName + " " + s.LastName).Trim(),
                s.CGPA,
                s.Department,
                s.InstitutionalId,
                s.Resumes.Count(),
                s.Applications.Count()
            ))
            .ToListAsync(ct);
    }
}
