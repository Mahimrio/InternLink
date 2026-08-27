using InternLinkApi.Models.Enums;

namespace InternLinkApi.Services.AIService;

public interface ILlmClient
{
    Task<LlmResponse> CompletePromptAsync(
        string systemPrompt, 
        string userPrompt, 
        IntegrationFeature feature, 
        Guid userId, 
        CancellationToken ct = default);
}
