using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface IResumeRepository : IRepository<Resume>
{
    Task<Resume?> GetByIdAndStudentIdAsync(Guid resumeId, Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<Resume>> GetByStudentIdAsync(Guid studentId, CancellationToken ct = default);
}
