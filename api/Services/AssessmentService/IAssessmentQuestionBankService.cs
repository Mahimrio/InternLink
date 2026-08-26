namespace InternLinkApi.Services.AssessmentService;

public class AssessmentQuestionDefinition
{
    public string QuestionId { get; set; } = string.Empty;
    public string SkillName { get; set; } = string.Empty;
    public string QuestionText { get; set; } = string.Empty;
    public List<string> Options { get; set; } = [];
    public int CorrectOptionIndex { get; set; }
    public string? Explanation { get; set; }
}

public interface IAssessmentQuestionBankService
{
    IReadOnlyList<AssessmentQuestionDefinition> GetQuestionsForSkill(string skillName);
    AssessmentQuestionDefinition? GetQuestionById(string questionId);
    bool HasQuestionsForSkill(string skillName);
    int TotalConfiguredSkillsCount { get; }
}
