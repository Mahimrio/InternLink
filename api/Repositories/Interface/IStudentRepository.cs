using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface IStudentRepository : IRepository<Student>
{
    Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Student?> GetWithSkillsByUserIdAsync(Guid userId, CancellationToken ct = default);
}
