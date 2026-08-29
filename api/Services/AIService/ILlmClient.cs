using InternLinkApi.Models.Enums;

namespace InternLinkApi.Services.AIService;

/// <summary>
/// Shared AI gateway every AI feature (ATS scoring, job matching, cover letters,
/// interview prep, skill gap) routes through. Implementations must log a ledger
/// row to AIHistory on every successful call.
/// </summary>
public interface ILlmClient
{
    Task<LlmResponse> CompletePromptAsync(
        string systemPrompt,
        string userPrompt,
        IntegrationFeature feature,
        Guid userId,
        CancellationToken ct = default);
}
