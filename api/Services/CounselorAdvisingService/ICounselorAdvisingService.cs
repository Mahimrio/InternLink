using InternLinkApi.DTOs;

namespace InternLinkApi.Services.CounselorAdvisingService;

public interface ICounselorAdvisingService
{
    Task<IReadOnlyList<CounselorStudentSummaryDto>> GetStudentsAsync(string? search, CancellationToken ct = default);
    Task<CounselorStudentDetailDto?> GetStudentDetailAsync(Guid studentId, CancellationToken ct = default);
    Task<CounselorFeedbackDto> CreateFeedbackAsync(Guid counselorUserId, Guid studentId, CreateCounselorFeedbackRequestDto dto, CancellationToken ct = default);
    Task<IReadOnlyList<CounselorFeedbackDto>> GetStudentFeedbackHistoryAsync(Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<CounselorFeedbackDto>> GetStudentOwnFeedbackAsync(Guid studentUserId, CancellationToken ct = default);
}
