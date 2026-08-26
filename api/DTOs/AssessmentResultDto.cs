namespace InternLinkApi.DTOs;

public record QuestionResultDto(
    string QuestionId,
    string QuestionText,
    List<string> Options,
    int SelectedOptionIndex,
    int CorrectOptionIndex,
    bool IsCorrect,
    string? Explanation
);

public record AssessmentResultDto(
    Guid SkillId,
    string SkillName,
    int Score,
    int PercentageScore,
    bool Passed,
    bool IsVerified,
    int CorrectCount,
    int TotalQuestions,
    int TimeSpentSeconds,
    DateTimeOffset EarnedDate,
    List<QuestionResultDto> Results
);
