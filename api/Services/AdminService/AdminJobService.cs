using System.Text.Json;
using InternLinkApi.DTOs;
using InternLinkApi.Helpers;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;
using InternLinkApi.Services.IngestionService;

namespace InternLinkApi.Services.AdminService;

public class AdminJobService : IAdminJobService
{
    private readonly IJobRepository _jobRepo;
    private readonly IExternalJobIngestionService _ingestionService;
    private readonly ILlmClient _llm;
    private readonly ILogger<AdminJobService> _logger;

    public AdminJobService(
        IJobRepository jobRepo,
        IExternalJobIngestionService ingestionService,
        ILlmClient llm,
        ILogger<AdminJobService> logger)
    {
        _jobRepo = jobRepo;
        _ingestionService = ingestionService;
        _llm = llm;
        _logger = logger;
    }

    public async Task<PagedResultDto<AdminJobDto>> GetJobsAsync(bool approved, int page, int pageSize, CancellationToken ct = default)
    {
        var (jobs, totalCount) = await _jobRepo.GetPagedByApprovalAsync(approved, page, pageSize, ct);
        var items = jobs.Select(JobMapper.ToAdminDto).ToList();
        return new PagedResultDto<AdminJobDto>(items, totalCount, page, pageSize);
    }

    public async Task ApproveAsync(Guid adminId, Guid jobId, CancellationToken ct = default)
    {
        var job = await _jobRepo.GetByIdAsync(jobId, ct)
            ?? throw new KeyNotFoundException("Job not found.");

        job.IsApproved = true;
        await _jobRepo.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Admin {AdminId} performed {Action} on {TargetType}:{TargetId} at {Timestamp}",
            adminId, "ApproveJob", "Job", jobId, DateTimeOffset.UtcNow);
    }

    // ── External job management ──────────────────────────────────────────────

    public async Task<ExternalJobSyncResultDto> SyncExternalJobsAsync(Guid adminId, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "Admin {AdminId} triggered manual external job sync at {Timestamp}",
            adminId, DateTimeOffset.UtcNow);

        var result = await _ingestionService.SyncAllSourcesAsync(ct);

        _logger.LogInformation(
            "Admin {AdminId} manual sync done — ingested={Ingested} skipped={Skipped} failed={Failed}",
            adminId, result.Ingested, result.Skipped, result.Failed);

        return result;
    }

    public async Task<AdminJobDto> CreateExternalJobAsync(Guid adminId, CreateExternalJobRequestDto dto, CancellationToken ct = default)
    {
        if (!Enum.TryParse<LocationType>(dto.LocationType, ignoreCase: true, out var locationType))
        {
            throw new ArgumentException($"Invalid LocationType '{dto.LocationType}'. Accepted: Remote, OnSite, Hybrid.");
        }

        // If the caller supplied an ExternalJobId, guard against duplicates.
        if (!string.IsNullOrWhiteSpace(dto.ExternalJobId))
        {
            var exists = await _jobRepo.ExistsExternalJobAsync(dto.ExternalSourceName, dto.ExternalJobId, ct);
            if (exists)
            {
                throw new InvalidOperationException(
                    $"A job with ExternalJobId='{dto.ExternalJobId}' from '{dto.ExternalSourceName}' already exists.");
            }
        }

        var job = new Job
        {
            Id = Guid.NewGuid(),
            CompanyId = null,
            Title = dto.Title,
            CoreDescription = dto.CoreDescription,
            SelectionCriteria = dto.SelectionCriteria,
            LocationType = locationType,
            DeadLine = dto.DeadLine == default ? DateTimeOffset.UtcNow.AddDays(30) : dto.DeadLine,
            IsApproved = true,  // admin-created externals are trusted; approve immediately
            IsClosed = false,
            Source = JobSource.External,
            ExternalSourceName = dto.ExternalSourceName,
            ExternalJobId = dto.ExternalJobId,
            ExternalApplyUrl = dto.ExternalApplyUrl,
            CompanyNameSnapshot = dto.CompanyNameSnapshot,
            LastSyncedAt = DateTimeOffset.UtcNow,
        };

        await _jobRepo.AddAsync(job, ct);
        await _jobRepo.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Admin {AdminId} manually created external job {JobId} from {Source} at {Timestamp}",
            adminId, job.Id, dto.ExternalSourceName, DateTimeOffset.UtcNow);

        return JobMapper.ToAdminDto(job);
    }

    public async Task<ParseExternalJobResponseDto> ParseExternalJobWithAiAsync(
        Guid adminId, ParseExternalJobRequestDto dto, CancellationToken ct = default)
    {
        const string systemPrompt =
            "You are a job-data extraction assistant. Extract the following fields from the raw job description text " +
            "the user provides. Respond ONLY with valid JSON matching this exact schema, no markdown fences, no prose: " +
            "{ " +
            "\"title\": string, " +
            "\"companyNameSnapshot\": string, " +
            "\"coreDescription\": string (200-600 words, clean plaintext), " +
            "\"selectionCriteria\": string (comma-separated qualifications or requirements), " +
            "\"locationType\": \"Remote\" | \"OnSite\" | \"Hybrid\", " +
            "\"externalApplyUrl\": string | null, " +
            "\"externalSourceName\": string | null, " +
            "\"suggestedSkillNames\": string[] (technology/skill keywords found in the ad, max 10) " +
            "}. " +
            "If a field cannot be determined from the text, use null for nullable fields or an empty string otherwise. " +
            "Never invent information that is not present in the input.";

        var userPrompt =
            $"Source portal: {dto.SourceName ?? "unknown"}\n" +
            $"Source URL: {dto.SourceUrl ?? "not provided"}\n\n" +
            $"--- Raw job ad ---\n{dto.RawContent}";

        try
        {
            var llmResponse = await _llm.CompletePromptAsync(
                systemPrompt,
                userPrompt,
                IntegrationFeature.ExternalJobParsing,
                adminId,
                ct);

            using var doc = JsonDocument.Parse(llmResponse.Content);
            var root = doc.RootElement;

            return new ParseExternalJobResponseDto
            {
                ParsedSuccessfully = true,
                Title = GetString(root, "title"),
                CompanyNameSnapshot = GetString(root, "companyNameSnapshot"),
                CoreDescription = GetString(root, "coreDescription"),
                SelectionCriteria = GetString(root, "selectionCriteria"),
                LocationType = GetString(root, "locationType"),
                ExternalApplyUrl = GetString(root, "externalApplyUrl") ?? dto.SourceUrl,
                ExternalSourceName = GetString(root, "externalSourceName") ?? dto.SourceName,
                SuggestedSkillNames = root.TryGetProperty("suggestedSkillNames", out var skills) && skills.ValueKind == JsonValueKind.Array
                    ? skills.EnumerateArray()
                        .Where(e => e.ValueKind == JsonValueKind.String)
                        .Select(e => e.GetString()!)
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Take(10)
                        .ToList()
                    : [],
            };
        }
        catch (AiServiceException ex)
        {
            _logger.LogWarning(ex, "AI smart-paste failed for admin {AdminId}: AI unavailable", adminId);
            return new ParseExternalJobResponseDto
            {
                ParsedSuccessfully = false,
                ParseError = "AI service is currently unavailable. Please fill in the fields manually.",
            };
        }
        catch (JsonException ex)
        {
            _logger.LogWarning(ex, "AI smart-paste returned malformed JSON for admin {AdminId}", adminId);
            return new ParseExternalJobResponseDto
            {
                ParsedSuccessfully = false,
                ParseError = "AI returned an unexpected response format. Please try again or fill in fields manually.",
            };
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static string? GetString(JsonElement element, string propertyName)
    {
        if (element.TryGetProperty(propertyName, out var prop) &&
            prop.ValueKind == JsonValueKind.String)
        {
            return prop.GetString();
        }

        return null;
    }
}
