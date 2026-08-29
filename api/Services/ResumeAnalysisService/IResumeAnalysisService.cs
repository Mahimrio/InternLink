using InternLinkApi.DTOs;

namespace InternLinkApi.Services.ResumeAnalysisService;

public interface IResumeAnalysisService
{
    /// <summary>General ATS scoring of a resume. Returns AtsScore -1 when analysis is unavailable.</summary>
    Task<AtsScoreResultDto> GetAtsScoreAsync(Guid userId, Guid resumeId, CancellationToken ct = default);

    /// <summary>Job-targeted before/after improvement suggestions. Returns an empty list when analysis is unavailable.</summary>
    Task<List<ResumeSuggestionDto>> GetImprovementSuggestionsAsync(Guid userId, Guid resumeId, Guid targetJobId, CancellationToken ct = default);
}
