using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using Microsoft.Extensions.Configuration;

namespace InternLinkApi.Services.AIService;

public class OpenAiClient : ILlmClient
{
    private readonly HttpClient _httpClient;
    private readonly ApplicationDbContext _dbContext;
    private readonly IConfiguration _configuration;
    
    // GPT-4o-mini pricing per token (checked Aug 2024: $0.150/1M input, $0.600/1M output)
    private const decimal CostPerInputTokenUsd = 0.150m / 1_000_000m;
    private const decimal CostPerOutputTokenUsd = 0.600m / 1_000_000m;

    public OpenAiClient(HttpClient httpClient, ApplicationDbContext dbContext, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _dbContext = dbContext;
        _configuration = configuration;
    }

    public async Task<LlmResponse> CompletePromptAsync(
        string systemPrompt, 
        string userPrompt, 
        IntegrationFeature feature, 
        Guid userId, 
        CancellationToken ct = default)
    {
        var model = _configuration["AiProvider:Model"] ?? "gpt-4o-mini";
        
        var requestBody = new
        {
            model = model,
            messages = new[]
            {
                new { role = "system", content = systemPrompt },
                new { role = "user", content = userPrompt }
            }
        };

        var requestContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        
        HttpResponseMessage? response = null;
        int attempt = 0;
        
    retry:
        try
        {
            response = await _httpClient.PostAsync("v1/chat/completions", requestContent, ct);
            response.EnsureSuccessStatusCode();
        }
        catch (HttpRequestException ex)
        {
            if (attempt == 0 && IsTransient(response?.StatusCode))
            {
                attempt++;
                await Task.Delay(500, ct);
                goto retry;
            }
            
            throw new AiServiceException("The AI provider is temporarily unavailable. Please try again later.", ex);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            if (attempt == 0)
            {
                attempt++;
                await Task.Delay(500, ct);
                goto retry;
            }
            
            throw new AiServiceException("The AI request timed out. Please try again.", ex);
        }

        var responseString = await response.Content.ReadAsStringAsync(ct);
        OpenAiResponse? openAiResponse;
        
        try
        {
            openAiResponse = JsonSerializer.Deserialize<OpenAiResponse>(responseString);
        }
        catch (JsonException ex)
        {
            throw new AiServiceException("Failed to parse response from AI provider.", ex);
        }

        if (openAiResponse?.Choices == null || openAiResponse.Choices.Length == 0 || openAiResponse.Usage == null)
        {
            throw new AiServiceException("Received invalid format from AI provider.", new Exception("Missing choices or usage in response."));
        }

        var content = openAiResponse.Choices[0].Message.Content;
        var promptTokens = openAiResponse.Usage.PromptTokens;
        var completionTokens = openAiResponse.Usage.CompletionTokens;
        var cost = (promptTokens * CostPerInputTokenUsd) + (completionTokens * CostPerOutputTokenUsd);

        var llmResponse = new LlmResponse
        {
            Content = content,
            PromptTokens = promptTokens,
            CompletionTokens = completionTokens,
            EstimatedCostUsd = cost
        };

        var contextStr = userPrompt.Length <= 200 ? userPrompt : userPrompt[..200] + "...";

        var history = new AIHistory
        {
            UserId = userId,
            IntegrationFeature = feature,
            PromptContext = contextStr,
            TokenCost = cost,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.AIHistories.Add(history);
        await _dbContext.SaveChangesAsync(ct);

        return llmResponse;
    }

    private bool IsTransient(System.Net.HttpStatusCode? statusCode)
    {
        if (statusCode == null) return true;
        int code = (int)statusCode.Value;
        return code == 429 || code == 500 || code == 502 || code == 503 || code == 504;
    }

    private class OpenAiResponse
    {
        [JsonPropertyName("choices")]
        public Choice[]? Choices { get; set; }

        [JsonPropertyName("usage")]
        public Usage? Usage { get; set; }
    }

    private class Choice
    {
        [JsonPropertyName("message")]
        public Message Message { get; set; } = new();
    }

    private class Message
    {
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;
    }

    private class Usage
    {
        [JsonPropertyName("prompt_tokens")]
        public int PromptTokens { get; set; }

        [JsonPropertyName("completion_tokens")]
        public int CompletionTokens { get; set; }
    }
}
