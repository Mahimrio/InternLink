using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class AIHistory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public IntegrationFeature IntegrationFeature { get; set; }

    /// <summary>Truncated summary of the prompt sent to the AI model (max 1000 chars).</summary>
    public string PromptContext { get; set; } = string.Empty;

    /// <summary>Monetary cost of the AI call in USD.</summary>
    public decimal TokenCost { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

    public User User { get; set; } = null!;
}
