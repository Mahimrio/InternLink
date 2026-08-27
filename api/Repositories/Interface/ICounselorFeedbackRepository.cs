using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface ICounselorFeedbackRepository : IRepository<CounselorFeedback>
{
    Task<IReadOnlyList<CounselorFeedback>> GetFeedbackByStudentIdAsync(Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<CounselorFeedback>> GetFeedbackByStudentUserIdAsync(Guid studentUserId, CancellationToken ct = default);
}
