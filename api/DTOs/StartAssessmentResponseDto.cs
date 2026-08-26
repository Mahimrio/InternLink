namespace InternLinkApi.DTOs;

public record StartAssessmentResponseDto(
    string SessionToken,
    Guid SkillId,
    string SkillName,
    string DomainClassification,
    int TimeLimitSeconds,
    List<AssessmentQuestionDto> Questions
);
