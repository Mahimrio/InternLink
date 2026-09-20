using System.Text.Json.Serialization;

namespace InternLinkApi.DTOs;

public class JobDto
{
    public Guid Id { get; set; }

    // Null for external jobs (no Company entity).
    public Guid? CompanyId { get; set; }

    /// <summary>Resolved display name: Company.CompanyName for internal, CompanyNameSnapshot for external.</summary>
    public string CompanyName { get; set; } = string.Empty;

    public string Title { get; set; } = string.Empty;
    public string CoreDescription { get; set; } = string.Empty;
    public string SelectionCriteria { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public DateTimeOffset DeadLine { get; set; }
    public bool HasApplied { get; set; }
    public List<JobSkillDto> RequiredSkills { get; set; } = [];

    // ── External source metadata (null for internal jobs) ──────────────
    /// <summary>"Internal" or "External". Drives UI badge and apply-flow branch.</summary>
    public string Source { get; set; } = "Internal";

    /// <summary>Portal name, e.g. "Arbeitnow". Null for internal jobs.</summary>
    public string? ExternalSourceName { get; set; }

    /// <summary>
    /// Direct apply URL on the external portal. Present only for external jobs.
    /// When non-null the frontend redirects the student here instead of opening the internal apply dialog.
    /// </summary>
    public string? ExternalApplyUrl { get; set; }
}

public class JobSkillDto
{
    public string SkillName { get; set; } = string.Empty;
    public int RequiredImportanceWeight { get; set; }

    [JsonPropertyName("weight")]
    public int Weight => RequiredImportanceWeight;
}
