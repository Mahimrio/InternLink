using System.Text.Json;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;

namespace InternLinkApi.Services.ResumeAnalysisService;

public class ResumeAnalysisService : IResumeAnalysisService
{
    private const string JsonRetryInstruction =
        " Your previous response was not valid JSON — respond with ONLY the JSON object, nothing else.";

    private static readonly JsonSerializerOptions ParseOptions = new() { PropertyNameCaseInsensitive = true };

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

        var result = await CompleteAndParseAsync<AtsScoreResultDto>(
            systemPrompt, userPrompt, IntegrationFeature.AtsScoring, userId, ct);

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

        var envelope = await CompleteAndParseAsync<SuggestionsEnvelope>(
            systemPrompt, userPrompt, IntegrationFeature.ResumeSuggestions, userId, ct);

        return envelope?.Suggestions ?? [];
    }

    private async Task<Resume> LoadOwnedResumeAsync(Guid userId, Guid resumeId, CancellationToken ct)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        return await _resumeRepository.GetByIdAndStudentIdAsync(resumeId, student.Id, ct)
            ?? throw new KeyNotFoundException("Resume not found.");
    }

    /// <summary>
    /// Calls the LLM and parses its JSON reply. On a malformed reply, retries once with a
    /// clarifying instruction; on a second failure (or provider failure) returns null so the
    /// caller can substitute a graceful fallback instead of propagating an error.
    /// </summary>
    private async Task<T?> CompleteAndParseAsync<T>(
        string systemPrompt, string userPrompt, IntegrationFeature feature, Guid userId, CancellationToken ct)
        where T : class
    {
        try
        {
            var response = await _llm.CompletePromptAsync(systemPrompt, userPrompt, feature, userId, ct);
            var parsed = TryParse<T>(response.Content);
            if (parsed is not null) return parsed;

            _logger.LogWarning("LLM returned malformed JSON for {Feature}, retrying once with clarification.", feature);
            var retryResponse = await _llm.CompletePromptAsync(
                systemPrompt + JsonRetryInstruction, userPrompt, feature, userId, ct);
            parsed = TryParse<T>(retryResponse.Content);

            if (parsed is null)
            {
                _logger.LogError("LLM returned malformed JSON for {Feature} after retry; falling back.", feature);
            }
            return parsed;
        }
        catch (AiServiceException ex)
        {
            _logger.LogError(ex, "AI provider failure during {Feature} analysis; falling back.", feature);
            return null;
        }
    }

    private static T? TryParse<T>(string content) where T : class
    {
        try
        {
            return JsonSerializer.Deserialize<T>(StripMarkdownFences(content), ParseOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    /// <summary>Models occasionally wrap replies in ```json fences despite instructions — strip them defensively.</summary>
    private static string StripMarkdownFences(string content)
    {
        var trimmed = content.Trim();
        if (!trimmed.StartsWith("```")) return trimmed;

        var firstNewline = trimmed.IndexOf('\n');
        if (firstNewline < 0) return trimmed;
        trimmed = trimmed[(firstNewline + 1)..];

        var closingFence = trimmed.LastIndexOf("```", StringComparison.Ordinal);
        return closingFence >= 0 ? trimmed[..closingFence].Trim() : trimmed.Trim();
    }

    private sealed record SuggestionsEnvelope(List<ResumeSuggestionDto> Suggestions);
}
