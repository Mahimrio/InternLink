namespace InternLinkApi.DTOs;

public class AdminJobDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public DateTimeOffset DeadLine { get; set; }
    public bool IsApproved { get; set; }
    public bool IsClosed { get; set; }

    // ── External source metadata ────────────────────────────────────────
    /// <summary>"Internal" or "External".</summary>
    public string Source { get; set; } = "Internal";

    /// <summary>Portal name, e.g. "Arbeitnow". Null for internal jobs.</summary>
    public string? ExternalSourceName { get; set; }

    /// <summary>Direct apply URL for external jobs.</summary>
    public string? ExternalApplyUrl { get; set; }
}
