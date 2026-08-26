using System.Text.Json;

namespace InternLinkApi.Services.AssessmentService;

public class AssessmentQuestionBankService : IAssessmentQuestionBankService
{
    private readonly Dictionary<string, List<AssessmentQuestionDefinition>> _questionsBySkill =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly Dictionary<string, AssessmentQuestionDefinition> _questionsById =
        new(StringComparer.OrdinalIgnoreCase);

    private readonly ILogger<AssessmentQuestionBankService> _logger;

    public AssessmentQuestionBankService(ILogger<AssessmentQuestionBankService> logger, IWebHostEnvironment? env = null)
    {
        _logger = logger;
        LoadQuestions(env);
    }

    public int TotalConfiguredSkillsCount => _questionsBySkill.Count;

    public IReadOnlyList<AssessmentQuestionDefinition> GetQuestionsForSkill(string skillName)
    {
        if (string.IsNullOrWhiteSpace(skillName)) return [];
        return _questionsBySkill.TryGetValue(skillName, out var list) ? list : [];
    }

    public AssessmentQuestionDefinition? GetQuestionById(string questionId)
    {
        if (string.IsNullOrWhiteSpace(questionId)) return null;
        return _questionsById.TryGetValue(questionId, out var q) ? q : null;
    }

    public bool HasQuestionsForSkill(string skillName)
    {
        if (string.IsNullOrWhiteSpace(skillName)) return false;
        return _questionsBySkill.ContainsKey(skillName);
    }

    private void LoadQuestions(IWebHostEnvironment? env)
    {
        var candidates = new List<string>();

        if (env != null && !string.IsNullOrEmpty(env.ContentRootPath))
        {
            candidates.Add(Path.Combine(env.ContentRootPath, "Data", "SeedData", "assessment-questions.json"));
        }

        candidates.Add(Path.Combine(Directory.GetCurrentDirectory(), "Data", "SeedData", "assessment-questions.json"));
        candidates.Add(Path.Combine(AppContext.BaseDirectory, "Data", "SeedData", "assessment-questions.json"));

        var filePath = candidates.FirstOrDefault(File.Exists);

        if (filePath == null)
        {
            _logger.LogWarning("Assessment questions seed file not found in any candidate path: {Paths}", string.Join(", ", candidates));
            return;
        }

        try
        {
            var json = File.ReadAllText(filePath);
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };

            var questions = JsonSerializer.Deserialize<List<AssessmentQuestionDefinition>>(json, options) ?? [];

            foreach (var q in questions)
            {
                if (string.IsNullOrWhiteSpace(q.QuestionId) || string.IsNullOrWhiteSpace(q.SkillName))
                    continue;

                _questionsById[q.QuestionId] = q;

                if (!_questionsBySkill.TryGetValue(q.SkillName, out var skillList))
                {
                    skillList = [];
                    _questionsBySkill[q.SkillName] = skillList;
                }

                skillList.Add(q);
            }

            _logger.LogInformation("Successfully loaded {QuestionCount} assessment questions across {SkillCount} skills from {FilePath}",
                _questionsById.Count, _questionsBySkill.Count, filePath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to parse assessment questions file at {FilePath}", filePath);
        }
    }
}
