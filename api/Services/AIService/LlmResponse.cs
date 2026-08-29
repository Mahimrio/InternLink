namespace InternLinkApi.Services.AIService;

/// <summary>Structured LLM completion result. Callers parse Content themselves; token counts feed the AIHistory ledger.</summary>
public record LlmResponse(
    string Content,
    int PromptTokens,
    int CompletionTokens,
    decimal EstimatedCostUsd
);
