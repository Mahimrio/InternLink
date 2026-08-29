namespace InternLinkApi.DTOs;

/// <summary>Combined response of POST api/student/resumes/{id}/analyze. Suggestions is null when no target job was given.</summary>
public record ResumeAnalysisResponseDto(
    AtsScoreResultDto Score,
    List<ResumeSuggestionDto>? Suggestions
);
