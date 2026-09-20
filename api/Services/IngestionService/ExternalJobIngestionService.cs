using System.Text.Json;
using System.Text.Json.Serialization;
using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Services.IngestionService;

/// <summary>
/// Fetches jobs from free public job-board APIs, deduplicates against the local database,
/// and persists newly discovered postings.
///
/// Current sources:
///   1. Arbeitnow  (https://www.arbeitnow.com/api/job-board-api) — free, no key required,
///      focuses on tech/remote/EU roles. Returns ~100 listings per call, refreshed daily.
///
/// Design principles
/// ─────────────────
/// • Idempotent: running twice never creates duplicate rows (dedup by ExternalSourceName + ExternalJobId).
/// • Fail-safe: a single bad listing is logged and skipped; the rest of the batch still ingests.
/// • Auto-approved: external jobs bypass the company approval queue and are visible immediately.
///   Admins can still close them via the admin panel.
/// • Skill matching: if the portal provides tags we try to match them to known platform Skills
///   by case-insensitive name so the recommendation engine can rank external jobs too.
/// </summary>
public class ExternalJobIngestionService : IExternalJobIngestionService
{
    private const string ArbeitnowSourceName = "Arbeitnow";
    private const string ArbeitnowApiUrl = "https://www.arbeitnow.com/api/job-board-api";

    private const string BdJobsSourceName = "BDJobs";
    private const string BdJobsApiUrl =
        "https://gateway.bdjobs.com/recruitment-account-test/api/JobSearch/GetJobSearch?isPro=1&rpp=20&pg=1";

    // External jobs are approved on ingest. They expire in 30 days unless the source
    // provides a concrete deadline.
    private static readonly TimeSpan DefaultExternalJobTtl = TimeSpan.FromDays(30);

    private readonly HttpClient _http;
    private readonly IJobRepository _jobRepo;
    private readonly IRepository<Skill> _skillRepo;
    private readonly ILogger<ExternalJobIngestionService> _logger;

    public ExternalJobIngestionService(
        HttpClient http,
        IJobRepository jobRepo,
        IRepository<Skill> skillRepo,
        ILogger<ExternalJobIngestionService> logger)
    {
        _http = http;
        _jobRepo = jobRepo;
        _skillRepo = skillRepo;
        _logger = logger;
    }

    public async Task<ExternalJobSyncResultDto> SyncAllSourcesAsync(CancellationToken ct = default)
    {
        var result = new ExternalJobSyncResultDto
        {
            SyncedAt = DateTimeOffset.UtcNow,
            SourcesQueried = [ArbeitnowSourceName, BdJobsSourceName],
        };

        var arbeitnowStats = await SyncArbeitnowAsync(ct);
        result.Ingested += arbeitnowStats.Ingested;
        result.Skipped += arbeitnowStats.Skipped;
        result.Failed += arbeitnowStats.Failed;

        var bdjobsStats = await SyncBdJobsAsync(ct);
        result.Ingested += bdjobsStats.Ingested;
        result.Skipped += bdjobsStats.Skipped;
        result.Failed += bdjobsStats.Failed;

        return result;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Arbeitnow
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<ExternalJobSyncResultDto> SyncArbeitnowAsync(CancellationToken ct)
    {
        var stats = new ExternalJobSyncResultDto();

        ArbeitnowResponse? response;
        try
        {
            _logger.LogInformation("ExternalIngestion: querying {Source}", ArbeitnowSourceName);
            var json = await _http.GetStringAsync(ArbeitnowApiUrl, ct);
            response = JsonSerializer.Deserialize<ArbeitnowResponse>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ExternalIngestion: failed to fetch {Source}", ArbeitnowSourceName);
            stats.Failed++;
            return stats;
        }

        if (response?.Data is null || response.Data.Count == 0)
        {
            _logger.LogWarning("ExternalIngestion: {Source} returned no listings", ArbeitnowSourceName);
            return stats;
        }

        // Preload all known Skills for tag-matching (read-once, no repeated queries per job).
        var allSkills = await _skillRepo.GetAllAsync(ct);
        var skillLookup = allSkills
            .GroupBy(s => s.SkillName.ToLowerInvariant())
            .ToDictionary(g => g.Key, g => g.First());

        foreach (var listing in response.Data)
        {
            try
            {
                await IngestArbeitnowListingAsync(listing, skillLookup, stats, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "ExternalIngestion: failed to ingest listing slug={Slug} from {Source}",
                    listing.Slug, ArbeitnowSourceName);
                stats.Failed++;
            }
        }

        _logger.LogInformation(
            "ExternalIngestion: {Source} done — ingested={Ingested}, skipped={Skipped}, failed={Failed}",
            ArbeitnowSourceName, stats.Ingested, stats.Skipped, stats.Failed);

        return stats;
    }

    private async Task IngestArbeitnowListingAsync(
        ArbeitnowListing listing,
        Dictionary<string, Skill> skillLookup,
        ExternalJobSyncResultDto stats,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(listing.Slug))
        {
            stats.Failed++;
            return;
        }

        // Deduplication check (uses database index, very fast).
        var exists = await _jobRepo.ExistsExternalJobAsync(ArbeitnowSourceName, listing.Slug, ct);
        if (exists)
        {
            stats.Skipped++;
            return;
        }

        var locationType = listing.Remote ? LocationType.Remote : LocationType.OnSite;

        var job = new Job
        {
            Id = Guid.NewGuid(),
            CompanyId = null,               // no Company entity for external jobs
            Title = Truncate(listing.Title ?? "Untitled", 250),
            CoreDescription = listing.Description ?? string.Empty,
            SelectionCriteria = string.Empty,
            LocationType = locationType,
            DeadLine = DateTimeOffset.UtcNow.Add(DefaultExternalJobTtl),
            IsApproved = true,              // auto-approve external listings
            IsClosed = false,
            Source = JobSource.External,
            ExternalSourceName = ArbeitnowSourceName,
            ExternalJobId = listing.Slug,
            ExternalApplyUrl = listing.Url,
            CompanyNameSnapshot = Truncate(listing.CompanyName ?? "Unknown Company", 200),
            LastSyncedAt = DateTimeOffset.UtcNow,
        };

        // Match portal tags to known Skills.
        var matchedJobSkills = MatchSkills(listing.Tags, skillLookup)
            .Select(skill => new JobSkill
            {
                JobId = job.Id,
                SkillId = skill.Id,
                RequiredImportanceWeight = 3, // treat tagged skills as "Preferred"
            }).ToList();

        job.JobSkills = matchedJobSkills;

        await _jobRepo.AddAsync(job, ct);
        await _jobRepo.SaveChangesAsync(ct);

        stats.Ingested++;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BDJobs (Bangladesh's #1 Job Portal)
    // ──────────────────────────────────────────────────────────────────────────

    private async Task<ExternalJobSyncResultDto> SyncBdJobsAsync(CancellationToken ct)
    {
        var stats = new ExternalJobSyncResultDto();

        BdJobsResponse? response;
        try
        {
            _logger.LogInformation("ExternalIngestion: querying {Source} from {Url}", BdJobsSourceName, BdJobsApiUrl);
            using var request = new HttpRequestMessage(HttpMethod.Get, BdJobsApiUrl);
            request.Headers.TryAddWithoutValidation("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
            request.Headers.TryAddWithoutValidation("Accept", "application/json, text/plain, */*");

            using var httpResponse = await _http.SendAsync(request, ct);
            httpResponse.EnsureSuccessStatusCode();

            var json = await httpResponse.Content.ReadAsStringAsync(ct);
            response = JsonSerializer.Deserialize<BdJobsResponse>(json, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ExternalIngestion: failed to fetch {Source}", BdJobsSourceName);
            stats.Failed++;
            return stats;
        }

        if (response?.Data is null || response.Data.Count == 0)
        {
            _logger.LogWarning("ExternalIngestion: {Source} returned no listings", BdJobsSourceName);
            return stats;
        }

        // Preload all known Skills for matching against BDJobs job postings
        var allSkills = await _skillRepo.GetAllAsync(ct);
        var skillList = allSkills.ToList();

        foreach (var listing in response.Data)
        {
            try
            {
                await IngestBdJobsListingAsync(listing, skillList, stats, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex,
                    "ExternalIngestion: failed to ingest listing id={Id} from {Source}",
                    listing.Jobid, BdJobsSourceName);
                stats.Failed++;
            }
        }

        _logger.LogInformation(
            "ExternalIngestion: {Source} done — ingested={Ingested}, skipped={Skipped}, failed={Failed}",
            BdJobsSourceName, stats.Ingested, stats.Skipped, stats.Failed);

        return stats;
    }

    private async Task IngestBdJobsListingAsync(
        BdJobsListing listing,
        List<Skill> skillList,
        ExternalJobSyncResultDto stats,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(listing.Jobid))
        {
            stats.Failed++;
            return;
        }

        // Deduplication check
        var exists = await _jobRepo.ExistsExternalJobAsync(BdJobsSourceName, listing.Jobid, ct);
        if (exists)
        {
            stats.Skipped++;
            return;
        }

        var isRemote = !string.IsNullOrWhiteSpace(listing.WorkPlace) &&
                       (listing.WorkPlace.Contains("Remote", StringComparison.OrdinalIgnoreCase) ||
                        listing.WorkPlace.Contains("Home", StringComparison.OrdinalIgnoreCase));

        var locationType = isRemote ? LocationType.Remote : LocationType.OnSite;

        // Parse deadline
        var deadline = DateTimeOffset.UtcNow.Add(DefaultExternalJobTtl);
        if (!string.IsNullOrWhiteSpace(listing.DeadlineDB) &&
            DateTimeOffset.TryParse(listing.DeadlineDB, out var parsedDeadline))
        {
            deadline = parsedDeadline > DateTimeOffset.UtcNow ? parsedDeadline : deadline;
        }

        // Direct apply URL to BDJobs details page
        var applyUrl = !string.IsNullOrWhiteSpace(listing.Jobid)
            ? $"https://jobs.bdjobs.com/jobdetails.asp?id={listing.Jobid}"
            : "https://jobs.bdjobs.com/";

        // Format description and requirements
        var description = listing.JobDescription ?? string.Empty;
        var selectionCriteria = "";
        if (!string.IsNullOrWhiteSpace(listing.EduRec))
        {
            selectionCriteria += $"Education: {listing.EduRec}\n";
        }
        if (!string.IsNullOrWhiteSpace(listing.Experience))
        {
            selectionCriteria += $"Experience: {listing.Experience}\n";
        }
        if (!string.IsNullOrWhiteSpace(listing.Location))
        {
            selectionCriteria += $"Location: {listing.Location}\n";
        }

        var job = new Job
        {
            Id = Guid.NewGuid(),
            CompanyId = null,
            Title = Truncate(listing.JobTitle ?? "Untitled BDJobs Position", 250),
            CoreDescription = description,
            SelectionCriteria = selectionCriteria,
            LocationType = locationType,
            DeadLine = deadline,
            IsApproved = true,
            IsClosed = false,
            Source = JobSource.External,
            ExternalSourceName = BdJobsSourceName,
            ExternalJobId = listing.Jobid,
            ExternalApplyUrl = applyUrl,
            CompanyNameSnapshot = Truncate(listing.CompanyName ?? "Confidential Company", 200),
            LastSyncedAt = DateTimeOffset.UtcNow,
        };

        // Match skills by scanning for platform skill names in Title, Description, and EduRec
        var textToSearch = $"{listing.JobTitle} {listing.JobDescription} {listing.EduRec}";
        var matchedSkills = skillList
            .Where(s => textToSearch.Contains(s.SkillName, StringComparison.OrdinalIgnoreCase))
            .DistinctBy(s => s.Id)
            .Take(10)
            .Select(skill => new JobSkill
            {
                JobId = job.Id,
                SkillId = skill.Id,
                RequiredImportanceWeight = 3,
            })
            .ToList();

        job.JobSkills = matchedSkills;

        await _jobRepo.AddAsync(job, ct);
        await _jobRepo.SaveChangesAsync(ct);

        stats.Ingested++;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Skill matching
    // ──────────────────────────────────────────────────────────────────────────

    /// <summary>Finds platform Skills whose names match any of the supplied portal tags.</summary>
    private static IEnumerable<Skill> MatchSkills(
        IReadOnlyList<string>? tags,
        Dictionary<string, Skill> skillLookup)
    {
        if (tags is null || tags.Count == 0) yield break;

        foreach (var tag in tags)
        {
            var key = tag.Trim().ToLowerInvariant();
            if (skillLookup.TryGetValue(key, out var skill))
            {
                yield return skill;
            }
        }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Helpers
    // ──────────────────────────────────────────────────────────────────────────

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    // ──────────────────────────────────────────────────────────────────────────
    // Arbeitnow API response shapes
    //
    // Endpoint: GET https://www.arbeitnow.com/api/job-board-api
    // ──────────────────────────────────────────────────────────────────────────

    private sealed class ArbeitnowResponse
    {
        [JsonPropertyName("data")]
        public List<ArbeitnowListing>? Data { get; set; }
    }

    private sealed class ArbeitnowListing
    {
        [JsonPropertyName("slug")]
        public string? Slug { get; set; }

        [JsonPropertyName("company_name")]
        public string? CompanyName { get; set; }

        [JsonPropertyName("title")]
        public string? Title { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("remote")]
        public bool Remote { get; set; }

        [JsonPropertyName("url")]
        public string? Url { get; set; }

        [JsonPropertyName("tags")]
        public List<string>? Tags { get; set; }

        [JsonPropertyName("job_types")]
        public List<string>? JobTypes { get; set; }
    }

    // ──────────────────────────────────────────────────────────────────────────
    // BDJobs API response shapes
    //
    // Endpoint: GET https://gateway.bdjobs.com/recruitment-account-test/api/JobSearch/GetJobSearch?isPro=1&rpp=20&pg=1
    // ──────────────────────────────────────────────────────────────────────────

    private sealed class BdJobsResponse
    {
        [JsonPropertyName("message")]
        public string? Message { get; set; }

        [JsonPropertyName("statuscode")]
        public string? StatusCode { get; set; }

        [JsonPropertyName("data")]
        public List<BdJobsListing>? Data { get; set; }
    }

    private sealed class BdJobsListing
    {
        [JsonPropertyName("Jobid")]
        public string? Jobid { get; set; }

        [JsonPropertyName("jobTitle")]
        public string? JobTitle { get; set; }

        [JsonPropertyName("companyName")]
        public string? CompanyName { get; set; }

        [JsonPropertyName("deadline")]
        public string? Deadline { get; set; }

        [JsonPropertyName("deadlineDB")]
        public string? DeadlineDB { get; set; }

        [JsonPropertyName("publishDate")]
        public string? PublishDate { get; set; }

        [JsonPropertyName("eduRec")]
        public string? EduRec { get; set; }

        [JsonPropertyName("experience")]
        public string? Experience { get; set; }

        [JsonPropertyName("location")]
        public string? Location { get; set; }

        [JsonPropertyName("jobDescription")]
        public string? JobDescription { get; set; }

        [JsonPropertyName("JobType")]
        public string? JobType { get; set; }

        [JsonPropertyName("WorkPlace")]
        public string? WorkPlace { get; set; }
    }
}
