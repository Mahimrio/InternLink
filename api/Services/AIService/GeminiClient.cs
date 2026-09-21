using System.Net;
using System.Text;
using System.Text.Json;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.AIService;

/// <summary>
/// Primary ILlmClient backed by Google Gemini (generateContent REST API).
/// Chosen over OpenAI for its free academic-friendly tier and reliable JSON output.
/// Writes an AIHistory ledger row on every successful completion.
/// </summary>
public class GeminiClient : ILlmClient
{
    // Pricing for gemini-3.6-flash in USD per 1M tokens (standard paid tier through 2026-12-31; doubles 2027-01-01).
    // Provider pricing changes — recheck periodically against https://ai.google.dev/gemini-api/docs/pricing
    private const decimal InputPricePerMillionTokensUsd = 0.75m;
    private const decimal OutputPricePerMillionTokensUsd = 3.75m;

    private const int MaxPromptContextLength = 200;
    private static readonly TimeSpan RetryDelay = TimeSpan.FromMilliseconds(500);

    private readonly HttpClient _http;
    private readonly IConfiguration _config;
    private readonly IRepository<AIHistory> _aiHistoryRepository;
    private readonly ILogger<GeminiClient> _logger;

    public GeminiClient(
        HttpClient http,
        IConfiguration config,
        IRepository<AIHistory> aiHistoryRepository,
        ILogger<GeminiClient> logger)
    {
        _http = http;
        _config = config;
        _aiHistoryRepository = aiHistoryRepository;
        _logger = logger;
    }

    public async Task<LlmResponse> CompletePromptAsync(
        string systemPrompt,
        string userPrompt,
        IntegrationFeature feature,
        Guid userId,
        CancellationToken ct = default)
    {
        var apiKey = _config["AiProvider:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new AiServiceException("AI features are not configured on this server.");
        }

        var primaryModel = _config["AiProvider:Model"] ?? "gemini-3.5-flash";
        var candidateModels = new[] { primaryModel, "gemini-3.5-flash", "gemini-3.6-flash", "gemini-2.5-flash-lite" }
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        var payload = JsonSerializer.Serialize(new
        {
            system_instruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = new[] { new { parts = new[] { new { text = userPrompt } } } },
        });

        var response = await SendWithRetryAndFallbackAsync(candidateModels, apiKey, payload, ct);
        var llmResponse = await ParseResponseAsync(response, ct);

        await WriteLedgerAsync(userId, feature, userPrompt, llmResponse.EstimatedCostUsd, ct);

        return llmResponse;
    }

    /// <summary>Exposed for unit testing the ledger math.</summary>
    public static decimal ComputeCostUsd(int promptTokens, int completionTokens) =>
        (promptTokens * InputPricePerMillionTokensUsd + completionTokens * OutputPricePerMillionTokensUsd) / 1_000_000m;

    private async Task<HttpResponseMessage> SendWithRetryAndFallbackAsync(
        string[] models, string apiKey, string payload, CancellationToken ct)
    {
        Exception? lastException = null;

        foreach (var model in models)
        {
            for (var attempt = 0; attempt < 2; attempt++)
            {
                try
                {
                    using var request = new HttpRequestMessage(HttpMethod.Post, $"v1beta/models/{model}:generateContent")
                    {
                        Content = new StringContent(payload, Encoding.UTF8, "application/json"),
                    };
                    request.Headers.Add("x-goog-api-key", apiKey);

                    var response = await _http.SendAsync(request, ct);

                    if (response.IsSuccessStatusCode)
                    {
                        return response;
                    }

                    var isTransient = response.StatusCode is HttpStatusCode.TooManyRequests
                        or HttpStatusCode.InternalServerError
                        or HttpStatusCode.BadGateway
                        or HttpStatusCode.ServiceUnavailable;

                    var body = await response.Content.ReadAsStringAsync(ct);
                    response.Dispose();

                    if (isTransient && attempt == 0)
                    {
                        _logger.LogWarning("Transient failure with {Model} ({StatusCode}), retrying once.", model, response.StatusCode);
                        await Task.Delay(RetryDelay, ct);
                        continue;
                    }

                    _logger.LogWarning("AI model {Model} returned {StatusCode}: {Body}. Trying fallback candidate if available.", model, response.StatusCode, Truncate(body, 200));
                    lastException = new AiServiceException($"The AI model {model} returned {response.StatusCode}.");
                    break; // break to try next model in candidateModels
                }
                catch (HttpRequestException ex)
                {
                    _logger.LogWarning(ex, "Connection failure with {Model}, trying fallback.", model);
                    lastException = new AiServiceException("The AI service is currently unavailable.", ex);
                    if (attempt == 0) await Task.Delay(RetryDelay, ct);
                }
                catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
                {
                    _logger.LogWarning(ex, "Request timeout with {Model}, trying fallback.", model);
                    lastException = new AiServiceException("The AI service took too long to respond.", ex);
                    if (attempt == 0) await Task.Delay(RetryDelay, ct);
                }
            }
        }

        throw lastException ?? new AiServiceException("The AI service is currently unavailable. Please try again later.");
    }

    private async Task<LlmResponse> ParseResponseAsync(HttpResponseMessage response, CancellationToken ct)
    {
        try
        {
            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var json = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var root = json.RootElement;

            var content = root
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString() ?? string.Empty;

            var usage = root.GetProperty("usageMetadata");
            var promptTokens = usage.TryGetProperty("promptTokenCount", out var pt) ? pt.GetInt32() : 0;
            var completionTokens = usage.TryGetProperty("candidatesTokenCount", out var ctk) ? ctk.GetInt32() : 0;

            return new LlmResponse(content, promptTokens, completionTokens, ComputeCostUsd(promptTokens, completionTokens));
        }
        catch (Exception ex) when (ex is KeyNotFoundException or IndexOutOfRangeException or InvalidOperationException or JsonException)
        {
            throw new AiServiceException("The AI service returned an unexpected response. Please try again later.", ex);
        }
        finally
        {
            response.Dispose();
        }
    }

    private async Task WriteLedgerAsync(Guid userId, IntegrationFeature feature, string userPrompt, decimal costUsd, CancellationToken ct)
    {
        // PromptContext is a truncated summary only — never the full prompt (may contain resume/PII content).
        var entry = new AIHistory
        {
            UserId = userId,
            IntegrationFeature = feature,
            PromptContext = Truncate(userPrompt, MaxPromptContextLength),
            TokenCost = costUsd,
            CreatedAt = DateTimeOffset.UtcNow,
        };

        await _aiHistoryRepository.AddAsync(entry, ct);
        await _aiHistoryRepository.SaveChangesAsync(ct);
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength] + "...";
}
