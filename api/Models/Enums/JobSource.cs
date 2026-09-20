namespace InternLinkApi.Models.Enums;

/// <summary>
/// Distinguishes jobs posted internally by verified companies from jobs
/// aggregated automatically or manually from external job portals (e.g. Arbeitnow, Remotive).
/// </summary>
public enum JobSource
{
    /// <summary>Posted directly by a verified company on the platform.</summary>
    Internal = 0,

    /// <summary>Imported from an external job portal via automated sync or manual admin entry.</summary>
    External = 1
}
