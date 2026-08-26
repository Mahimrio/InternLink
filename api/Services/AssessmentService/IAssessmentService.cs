using InternLinkApi.DTOs;

namespace InternLinkApi.Services.AssessmentService;

public interface IAssessmentService
{
    Task<IReadOnlyList<AssessmentSkillDto>> GetAvailableSkillsAsync(Guid userId, CancellationToken ct = default);
    Task<StartAssessmentResponseDto> StartAssessmentAsync(Guid userId, Guid skillId, CancellationToken ct = default);
    Task<AssessmentResultDto> SubmitAssessmentAsync(Guid userId, SubmitAssessmentRequestDto request, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetVerifiedSkillsAsync(Guid userId, CancellationToken ct = default);
}
