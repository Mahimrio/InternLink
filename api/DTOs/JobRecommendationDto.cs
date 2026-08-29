namespace InternLinkApi.DTOs;

public class JobRecommendationDto
{
    public JobDto Job { get; set; } = null!;

    /// <summary>0-100; LLM-ranked when enough candidates exist, otherwise raw skill-overlap ratio.</summary>
    public int MatchPercentage { get; set; }

    public string Reason { get; set; } = string.Empty;
}
