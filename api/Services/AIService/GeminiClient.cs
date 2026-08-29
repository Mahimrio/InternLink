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

        var model = _config["AiProvider:Model"] ?? "gemini-3.6-flash";

        var payload = JsonSerializer.Serialize(new
        {
            system_instruction = new { parts = new[] { new { text = systemPrompt } } },
            contents = new[] { new { parts = new[] { new { text = userPrompt } } } },
        });

        var response = await SendWithRetryOnceAsync(model, apiKey, payload, ct);
        var llmResponse = await ParseResponseAsync(response, ct);

        await WriteLedgerAsync(userId, feature, userPrompt, llmResponse.EstimatedCostUsd, ct);

        return llmResponse;
    }

    /// <summary>Exposed for unit testing the ledger math.</summary>
    public static decimal ComputeCostUsd(int promptTokens, int completionTokens) =>
        (promptTokens * InputPricePerMillionTokensUsd + completionTokens * OutputPricePerMillionTokensUsd) / 1_000_000m;

    private async Task<HttpResponseMessage> SendWithRetryOnceAsync(string model, string apiKey, string payload, CancellationToken ct)
    {
        for (var attempt = 0; ; attempt++)
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
                    _logger.LogWarning("Transient AI provider failure ({StatusCode}), retrying once.", response.StatusCode);
                    await Task.Delay(RetryDelay, ct);
                    continue;
                }

                // Non-transient (e.g. 400 malformed input) or retry exhausted — retrying won't fix it.
                _logger.LogError("AI provider returned {StatusCode}: {Body}", response.StatusCode, Truncate(body, 500));
                throw new AiServiceException("The AI service is currently unavailable. Please try again later.");
            }
            catch (HttpRequestException ex) when (attempt == 0)
            {
                _logger.LogWarning(ex, "AI provider connection failure, retrying once.");
                await Task.Delay(RetryDelay, ct);
            }
            catch (TaskCanceledException ex) when (!ct.IsCancellationRequested && attempt == 0)
            {
                // HttpClient timeout (not caller cancellation) — transient, retry once.
                _logger.LogWarning(ex, "AI provider request timed out, retrying once.");
                await Task.Delay(RetryDelay, ct);
            }
            catch (HttpRequestException ex)
            {
                throw new AiServiceException("The AI service is currently unavailable. Please try again later.", ex);
            }
            catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
            {
                throw new AiServiceException("The AI service took too long to respond. Please try again later.", ex);
            }
        }
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
