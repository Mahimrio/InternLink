using InternLinkApi.Data;
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
}
