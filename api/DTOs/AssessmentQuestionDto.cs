namespace InternLinkApi.DTOs;

public record AssessmentQuestionDto(
    string QuestionId,
    string QuestionText,
    List<string> Options
);
