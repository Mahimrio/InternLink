using InternLinkApi.DTOs;
using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface IStudentRepository : IRepository<Student>
{
    Task<Student?> GetByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Student?> GetWithSkillsByUserIdAsync(Guid userId, CancellationToken ct = default);
    Task<Student?> GetByIdWithUserAsync(Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<CounselorStudentSummaryDto>> GetCounselorStudentSummariesAsync(string? search, CancellationToken ct = default);
}
