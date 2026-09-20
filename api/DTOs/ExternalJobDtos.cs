using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

/// <summary>
/// Request DTO used by admins to manually add a single external job posting
/// without going through the automated sync pipeline.
/// </summary>
public class CreateExternalJobRequestDto
{
    [Required, MinLength(3), MaxLength(250)]
    public string Title { get; set; } = string.Empty;

    [Required, MinLength(20)]
    public string CoreDescription { get; set; } = string.Empty;

    public string SelectionCriteria { get; set; } = string.Empty;

    /// <summary>"Remote", "OnSite", or "Hybrid".</summary>
    [Required]
    public string LocationType { get; set; } = string.Empty;

    public DateTimeOffset DeadLine { get; set; } = DateTimeOffset.UtcNow.AddDays(30);

    /// <summary>Human-readable name of the source portal, e.g. "BDJobs", "LinkedIn".</summary>
    [Required, MaxLength(100)]
    public string ExternalSourceName { get; set; } = string.Empty;

    /// <summary>Canonical URL where candidates apply on the external portal.</summary>
    [Required, Url]
    public string ExternalApplyUrl { get; set; } = string.Empty;

    /// <summary>Company name as shown on the external portal.</summary>
    [Required, MaxLength(200)]
    public string CompanyNameSnapshot { get; set; } = string.Empty;

    /// <summary>
    /// Optional: the unique ID/slug on the source portal.
    /// If provided, duplicate-detection will prevent re-ingestion of the same posting.
    /// </summary>
    [MaxLength(255)]
    public string? ExternalJobId { get; set; }
}

/// <summary>
/// Result summary returned after an automated or manually-triggered sync run.
/// </summary>
public class ExternalJobSyncResultDto
{
    /// <summary>Jobs newly persisted to the database.</summary>
    public int Ingested { get; set; }

    /// <summary>Jobs skipped because they already exist (deduplication).</summary>
    public int Skipped { get; set; }

    /// <summary>Jobs that failed to parse or persist (check server logs for details).</summary>
    public int Failed { get; set; }

    /// <summary>UTC timestamp of when the sync run started.</summary>
    public DateTimeOffset SyncedAt { get; set; } = DateTimeOffset.UtcNow;

    /// <summary>Source portal names that were queried during this run.</summary>
    public List<string> SourcesQueried { get; set; } = [];
}

/// <summary>
/// Request DTO for the AI smart-paste endpoint.
/// The admin pastes the raw text of an external job ad; the AI extracts structured fields.
/// </summary>
public class ParseExternalJobRequestDto
{
    /// <summary>
    /// Raw job description text copied from the external portal.
    /// Can include HTML or plain text; the AI will normalise it.
    /// </summary>
    [Required, MinLength(50)]
    public string RawContent { get; set; } = string.Empty;

    /// <summary>Optional: pre-fill the portal name, e.g. "BDJobs".</summary>
    [MaxLength(100)]
    public string? SourceName { get; set; }

    /// <summary>Optional: URL of the original posting (becomes ExternalApplyUrl if provided).</summary>
    [Url]
    public string? SourceUrl { get; set; }
}

/// <summary>
/// AI-extracted fields returned by the smart-paste endpoint.
/// The admin reviews and optionally edits before calling CreateExternalJobAsync.
/// </summary>
public class ParseExternalJobResponseDto
{
    public bool ParsedSuccessfully { get; set; }
    public string? ParseError { get; set; }

    public string? Title { get; set; }
    public string? CoreDescription { get; set; }
    public string? SelectionCriteria { get; set; }

    /// <summary>Suggested LocationType string: "Remote", "OnSite", or "Hybrid".</summary>
    public string? LocationType { get; set; }

    public string? CompanyNameSnapshot { get; set; }
    public string? ExternalApplyUrl { get; set; }
    public string? ExternalSourceName { get; set; }

    /// <summary>Skill names extracted from the job description. The admin maps them to platform skills.</summary>
    public List<string> SuggestedSkillNames { get; set; } = [];
}
