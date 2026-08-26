using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.AssessmentService;

public class AssessmentService : IAssessmentService
{
    private readonly IAssessmentRepository _assessmentRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IAssessmentQuestionBankService _questionBank;
    private readonly IAssessmentSessionService _sessionService;
    private readonly ILogger<AssessmentService> _logger;

    public AssessmentService(
        IAssessmentRepository assessmentRepo,
        IStudentRepository studentRepo,
        IAssessmentQuestionBankService questionBank,
        IAssessmentSessionService sessionService,
        ILogger<AssessmentService> logger)
    {
        _assessmentRepo = assessmentRepo;
        _studentRepo = studentRepo;
        _questionBank = questionBank;
        _sessionService = sessionService;
        _logger = logger;
    }

    public async Task<IReadOnlyList<AssessmentSkillDto>> GetAvailableSkillsAsync(Guid userId, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var allSkills = await _assessmentRepo.GetAllSkillsAsync(ct);
        var assessments = await _assessmentRepo.GetByStudentIdAsync(student.Id, ct);

        var assessmentGroups = assessments
            .GroupBy(a => a.SkillId)
            .ToDictionary(g => g.Key, g => g.ToList());

        var result = new List<AssessmentSkillDto>();

        foreach (var skill in allSkills)
        {
            var hasAttempts = assessmentGroups.TryGetValue(skill.Id, out var attempts);
            int? bestScore = hasAttempts ? attempts!.Max(a => a.AchievedScore) : null;
            int attemptsCount = hasAttempts ? attempts!.Count : 0;
            bool isVerified = bestScore.HasValue && bestScore.Value >= 70;
            DateTimeOffset? lastAttempt = hasAttempts ? attempts!.Max(a => a.EarnedDate) : null;

            result.Add(new AssessmentSkillDto(
                skill.Id,
                skill.SkillName,
                skill.DomainClassification.ToString(),
                bestScore,
                attemptsCount,
                isVerified,
                lastAttempt
            ));
        }

        return result;
    }

    public async Task<StartAssessmentResponseDto> StartAssessmentAsync(Guid userId, Guid skillId, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var skill = await _assessmentRepo.GetSkillByIdAsync(skillId, ct)
            ?? throw new KeyNotFoundException("Skill not found.");

        var questions = _questionBank.GetQuestionsForSkill(skill.SkillName);
        if (questions.Count == 0)
        {
            throw new InvalidOperationException($"No assessment questions configured for skill '{skill.SkillName}'.");
        }

        // Take up to 5 questions
        var selectedQuestions = questions.Take(5).ToList();
        var questionIds = selectedQuestions.Select(q => q.QuestionId).ToList();

        var sessionToken = _sessionService.CreateSessionToken(
            student.Id,
            skill.Id,
            skill.SkillName,
            questionIds,
            timeLimitSeconds: 600,
            graceBufferSeconds: 15
        );

        // Strip correct answers before returning to client
        var questionDtos = selectedQuestions.Select(q => new AssessmentQuestionDto(
            q.QuestionId,
            q.QuestionText,
            q.Options
        )).ToList();

        _logger.LogInformation("Student {StudentId} started timed assessment for skill {SkillName} ({SkillId})",
            student.Id, skill.SkillName, skill.Id);

        return new StartAssessmentResponseDto(
            sessionToken,
            skill.Id,
            skill.SkillName,
            skill.DomainClassification.ToString(),
            600,
            questionDtos
        );
    }

    public async Task<AssessmentResultDto> SubmitAssessmentAsync(Guid userId, SubmitAssessmentRequestDto request, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        if (!_sessionService.TryValidateSessionToken(
            request.SessionToken,
            student.Id,
            out var payload,
            out var errorMessage))
        {
            _logger.LogWarning("Assessment submission rejected for student {StudentId}: {Error}", student.Id, errorMessage);
            throw new InvalidOperationException(errorMessage ?? "Invalid assessment session.");
        }

        var submittedAnswers = (request.Answers ?? [])
            .GroupBy(a => a.QuestionId)
            .ToDictionary(g => g.Key, g => g.First().SelectedOptionIndex, StringComparer.OrdinalIgnoreCase);

        var questionResults = new List<QuestionResultDto>();
        int correctCount = 0;

        foreach (var qId in payload!.QuestionIds)
        {
            var questionDef = _questionBank.GetQuestionById(qId);
            if (questionDef == null) continue;

            submittedAnswers.TryGetValue(qId, out var selectedIndex);

            bool isCorrect = selectedIndex == questionDef.CorrectOptionIndex;
            if (isCorrect)
            {
                correctCount++;
            }

            questionResults.Add(new QuestionResultDto(
                questionDef.QuestionId,
                questionDef.QuestionText,
                questionDef.Options,
                selectedIndex,
                questionDef.CorrectOptionIndex,
                isCorrect,
                questionDef.Explanation
            ));
        }

        int totalQuestions = Math.Max(1, payload.QuestionIds.Count);
        int percentageScore = (int)Math.Round((double)correctCount / totalQuestions * 100.0);
        bool passed = percentageScore >= 70;

        var now = DateTimeOffset.UtcNow;
        var timeSpentSeconds = (int)Math.Max(0, now.ToUnixTimeSeconds() - payload.StartedAt);

        // Record immutable assessment result
        var assessment = new Assessment
        {
            StudentId = student.Id,
            SkillId = payload.SkillId,
            AchievedScore = percentageScore,
            EarnedDate = now
        };

        await _assessmentRepo.AddAssessmentAsync(assessment, ct);

        // If passed (>= 70%), ensure StudentSkill association is populated
        if (passed)
        {
            await _assessmentRepo.EnsureStudentSkillLinkedAsync(student.Id, payload.SkillId, proficiency: 4, ct);
        }

        await _assessmentRepo.SaveChangesAsync(ct);

        // Derived read for verification
        var verifiedSkillIds = await _assessmentRepo.GetVerifiedSkillIdsForStudentAsync(student.Id, ct);
        bool isVerified = verifiedSkillIds.Contains(payload.SkillId);

        _logger.LogInformation("Student {StudentId} completed assessment for skill {SkillName}. Score: {Score}% (Passed: {Passed}, Verified: {IsVerified})",
            student.Id, payload.SkillName, percentageScore, passed, isVerified);

        return new AssessmentResultDto(
            payload.SkillId,
            payload.SkillName,
            percentageScore,
            percentageScore,
            passed,
            isVerified,
            correctCount,
            totalQuestions,
            timeSpentSeconds,
            now,
            questionResults
        );
    }

    public async Task<IReadOnlyList<string>> GetVerifiedSkillsAsync(Guid userId, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        return await _assessmentRepo.GetVerifiedSkillNamesForStudentAsync(student.Id, ct);
    }
}
