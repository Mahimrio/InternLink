using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class Job
{
    public Guid Id { get; set; } = Guid.NewGuid();

    // Null for external (aggregated) jobs; populated for internal postings by verified companies.
    public Guid? CompanyId { get; set; }

    public string Title { get; set; } = string.Empty;
    public string CoreDescription { get; set; } = string.Empty;
    public string SelectionCriteria { get; set; } = string.Empty;
    public LocationType LocationType { get; set; }
    public DateTimeOffset DeadLine { get; set; }

    // Set by admin approval only. Company edits to an already-approved job do NOT reset this
    // (see CompanyJobService.UpdateJobAsync); a stricter version could re-queue significant edits.
    public bool IsApproved { get; set; } = false;
    public bool IsClosed { get; set; } = false;

    // ── External aggregation metadata ────────────────────────────────────────
    /// <summary>
    /// Indicates whether this posting originated from the platform (Internal)
    /// or was imported from a third-party job portal (External).
    /// </summary>
    public JobSource Source { get; set; } = JobSource.Internal;

    /// <summary>
    /// Human-readable name of the portal this job was fetched from, e.g. "Arbeitnow".
    /// Null for internal jobs. Together with ExternalJobId, forms the deduplication key.
    /// </summary>
    public string? ExternalSourceName { get; set; }

    /// <summary>
    /// Unique identifier issued by the source portal (slug, integer ID, etc.).
    /// Null for internal jobs. Used with ExternalSourceName to prevent duplicate ingestion.
    /// </summary>
    public string? ExternalJobId { get; set; }

    /// <summary>
    /// Direct URL on the external portal where the candidate applies.
    /// Students are redirected here instead of going through the internal ATS flow.
    /// Null for internal jobs.
    /// </summary>
    public string? ExternalApplyUrl { get; set; }

    /// <summary>
    /// Company name as provided by the external source. There is no Company entity
    /// for external postings, so this snapshot is used for display purposes.
    /// Null for internal jobs.
    /// </summary>
    public string? CompanyNameSnapshot { get; set; }

    /// <summary>UTC timestamp of the last successful sync from the external source.</summary>
    public DateTimeOffset? LastSyncedAt { get; set; }

    // Navigation properties
    public Company? Company { get; set; }
    public ICollection<Application> Applications { get; set; } = [];
    public ICollection<JobSkill> JobSkills { get; set; } = [];
}
