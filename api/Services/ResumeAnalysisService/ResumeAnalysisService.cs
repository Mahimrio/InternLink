using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;

namespace InternLinkApi.Services.ResumeAnalysisService;

public class ResumeAnalysisService : IResumeAnalysisService
{
    private readonly ILlmClient _llm;
    private readonly IStudentRepository _studentRepository;
    private readonly IResumeRepository _resumeRepository;
    private readonly IJobRepository _jobRepository;
    private readonly ILogger<ResumeAnalysisService> _logger;

    public ResumeAnalysisService(
        ILlmClient llm,
        IStudentRepository studentRepository,
        IResumeRepository resumeRepository,
        IJobRepository jobRepository,
        ILogger<ResumeAnalysisService> logger)
    {
        _llm = llm;
        _studentRepository = studentRepository;
        _resumeRepository = resumeRepository;
        _jobRepository = jobRepository;
        _logger = logger;
    }

    public async Task<AtsScoreResultDto> GetAtsScoreAsync(Guid userId, Guid resumeId, CancellationToken ct = default)
    {
        var resume = await LoadOwnedResumeAsync(userId, resumeId, ct);

        const string systemPrompt =
            "You are an expert ATS (Applicant Tracking System) resume reviewer for university students seeking internships. " +
            "Respond with ONLY valid JSON matching this exact schema, no markdown fences, no prose before or after: " +
            "{ \"atsScore\": number between 0 and 100, \"grammarIssues\": string[], \"structureCritique\": string, \"missingKeywords\": string[] }. " +
            "Be specific and concrete: reference actual content from the resume, not generic advice.";

        var userPrompt = $"Analyze this resume (structured JSON from a resume builder):\n{resume.DynamicJsonData}";

        var result = await _llm.CompleteAndParseJsonAsync<AtsScoreResultDto>(
            systemPrompt, userPrompt, IntegrationFeature.AtsScoring, userId, _logger, ct);

        return result ?? new AtsScoreResultDto(
            -1, [], "Analysis temporarily unavailable, please try again.", []);
    }

    public async Task<List<ResumeSuggestionDto>> GetImprovementSuggestionsAsync(
        Guid userId, Guid resumeId, Guid targetJobId, CancellationToken ct = default)
    {
        var resume = await LoadOwnedResumeAsync(userId, resumeId, ct);
        var job = await _jobRepository.GetByIdAsync(targetJobId, ct)
            ?? throw new KeyNotFoundException("Target job not found.");

        const string systemPrompt =
            "You are an expert resume coach tailoring a student resume to a specific internship posting. " +
            "Respond with ONLY valid JSON matching this exact schema, no markdown fences, no prose before or after: " +
            "{ \"suggestions\": [{ \"originalText\": string, \"suggestedText\": string, \"reason\": string }] }. " +
            "originalText must quote actual text from the resume; suggestedText is the improved replacement. " +
            "Give 3 to 6 concrete suggestions targeted at the job requirements.";

        var userPrompt =
            $"Resume (structured JSON from a resume builder):\n{resume.DynamicJsonData}\n\n" +
            $"Target job \"{job.Title}\":\nDescription: {job.CoreDescription}\nSelection criteria: {job.SelectionCriteria}";

        var envelope = await _llm.CompleteAndParseJsonAsync<SuggestionsEnvelope>(
            systemPrompt, userPrompt, IntegrationFeature.ResumeSuggestions, userId, _logger, ct);

        return envelope?.Suggestions ?? [];
    }

    private async Task<Resume> LoadOwnedResumeAsync(Guid userId, Guid resumeId, CancellationToken ct)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        return await _resumeRepository.GetByIdAndStudentIdAsync(resumeId, student.Id, ct)
            ?? throw new KeyNotFoundException("Resume not found.");
    }

    private sealed record SuggestionsEnvelope(List<ResumeSuggestionDto> Suggestions);
}
