using System.Text.Json;
using InternLinkApi.Models.Enums;

namespace InternLinkApi.Services.AIService;

/// <summary>
/// Shared "call the LLM, parse strict JSON, retry once on malformed output" flow used by
/// every AI feature so each service doesn't reimplement fence-stripping and retry logic.
/// </summary>
public static class LlmClientJsonExtensions
{
    private const string JsonRetryInstruction =
        " Your previous response was not valid JSON — respond with ONLY the JSON object, nothing else.";

    private static readonly JsonSerializerOptions ParseOptions = new() { PropertyNameCaseInsensitive = true };

    /// <summary>
    /// Calls the LLM and parses its JSON reply. On a malformed reply, retries once with a
    /// clarifying instruction; on a second failure (or provider failure) returns null so the
    /// caller can substitute a graceful fallback instead of propagating an error.
    /// </summary>
    public static async Task<T?> CompleteAndParseJsonAsync<T>(
        this ILlmClient llm,
        string systemPrompt,
        string userPrompt,
        IntegrationFeature feature,
        Guid userId,
        ILogger logger,
        CancellationToken ct)
        where T : class
    {
        try
        {
            var response = await llm.CompletePromptAsync(systemPrompt, userPrompt, feature, userId, ct);
            var parsed = TryParse<T>(response.Content);
            if (parsed is not null) return parsed;

            logger.LogWarning("LLM returned malformed JSON for {Feature}, retrying once with clarification.", feature);
            var retryResponse = await llm.CompletePromptAsync(
                systemPrompt + JsonRetryInstruction, userPrompt, feature, userId, ct);
            parsed = TryParse<T>(retryResponse.Content);

            if (parsed is null)
            {
                logger.LogError("LLM returned malformed JSON for {Feature} after retry; falling back.", feature);
            }
            return parsed;
        }
        catch (AiServiceException ex)
        {
            logger.LogError(ex, "AI provider failure during {Feature}; falling back.", feature);
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
}
