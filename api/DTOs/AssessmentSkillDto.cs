namespace InternLinkApi.DTOs;

public record AssessmentSkillDto(
    Guid SkillId,
    string SkillName,
    string DomainClassification,
    int? BestScore,
    int AttemptsCount,
    bool IsVerified,
    DateTimeOffset? LastAttemptDate
);
