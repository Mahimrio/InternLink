using InternLinkApi.DTOs;
using InternLinkApi.Exceptions;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.ResumeService;
using InternLinkApi.Services.StudentSkillService;

namespace InternLinkApi.Services.AtsService;

public class AtsService : IAtsService
{
    private readonly IApplicationRepository _applicationRepo;
    private readonly ICompanyRepository _companyRepo;
    private readonly IRepository<Interview> _interviewRepo;
    private readonly IStudentSkillService _studentSkillService;
    private readonly ISupabaseStorageService _storageService;

    // Explicit forward transition graph. Rejected is reachable from any earlier (non-terminal)
    // state so a recruiter can reject at any point; Offered/Rejected are terminal. Anything not
    // listed here (including moving backward or to the same state) is an invalid transition.
    private static readonly IReadOnlyDictionary<ApplicationStatus, HashSet<ApplicationStatus>> AllowedTransitions =
        new Dictionary<ApplicationStatus, HashSet<ApplicationStatus>>
        {
            [ApplicationStatus.Applied] = [ApplicationStatus.Screened, ApplicationStatus.Rejected],
            [ApplicationStatus.Screened] = [ApplicationStatus.Scheduled, ApplicationStatus.Rejected],
            [ApplicationStatus.Scheduled] = [ApplicationStatus.Offered, ApplicationStatus.Rejected],
            [ApplicationStatus.Offered] = [],
            [ApplicationStatus.Rejected] = [],
        };

    public AtsService(
        IApplicationRepository applicationRepo,
        ICompanyRepository companyRepo,
        IRepository<Interview> interviewRepo,
        IStudentSkillService studentSkillService,
        ISupabaseStorageService storageService)
    {
        _applicationRepo = applicationRepo;
        _companyRepo = companyRepo;
        _interviewRepo = interviewRepo;
        _studentSkillService = studentSkillService;
        _storageService = storageService;
    }

    public async Task<PagedResultDto<AtsApplicationListItemDto>> GetApplicationsAsync(
        Guid userId, Guid? jobId, string? status, int page, int pageSize, CancellationToken ct = default)
    {
        var company = await _companyRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Company profile not found.");

        ApplicationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status)
            && Enum.TryParse<ApplicationStatus>(status, ignoreCase: true, out var s)
            && Enum.IsDefined(s))
        {
            parsedStatus = s;
        }

        var (applications, totalCount) = await _applicationRepo.GetCompanyApplicationsAsync(
            company.Id, jobId, parsedStatus, page, pageSize, ct);

        var studentIds = applications.Select(a => a.StudentId).Distinct().ToList();
        var skillCounts = await _studentSkillService.GetVerifiedSkillCountsAsync(studentIds, ct);

        var items = applications.Select(a =>
        {
            var item = ToListItem(a);
            item.VerifiedSkillCount = skillCounts.TryGetValue(a.StudentId, out var count) ? count : 0;
            return item;
        }).ToList();

        return new PagedResultDto<AtsApplicationListItemDto>(items, totalCount, page, pageSize);
    }

    public async Task<AtsApplicantDetailDto?> GetApplicationDetailAsync(
        Guid userId, Guid applicationId, CancellationToken ct = default)
    {
        var company = await _companyRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Company profile not found.");

        var application = await _applicationRepo.GetCompanyApplicationDetailAsync(company.Id, applicationId, ct);
        if (application is null)
        {
            return null;
        }

        string? resumeUrl = null;
        if (application.AttachedResume is not null
            && !string.IsNullOrWhiteSpace(application.AttachedResume.DocumentPath))
        {
            resumeUrl = await _storageService.CreateSignedUrlAsync(
                "resumes", application.AttachedResume.DocumentPath, 3600, ct);
        }

        var verifiedSkills = await _studentSkillService.GetVerifiedSkillNamesAsync(application.StudentId, ct);

        var latestInterview = application.Interviews
            .OrderByDescending(i => i.ScheduledDateTime)
            .FirstOrDefault();

        return new AtsApplicantDetailDto
        {
            ApplicationId = application.Id,
            JobId = application.JobId,
            JobTitle = application.Job?.Title ?? string.Empty,
            ApplicationStatus = application.ApplicationStatus.ToString(),
            SubmittedAt = application.SubmittedAt,
            StudentName = FullName(application.Student),
            Department = application.Student?.Department ?? string.Empty,
            Cgpa = application.Student?.CGPA ?? 0m,
            ResumeDownloadUrl = resumeUrl,
            VerifiedSkills = verifiedSkills.ToList(),
            Interview = latestInterview is null
                ? null
                : new AtsInterviewDto
                {
                    ScheduledDateTime = latestInterview.ScheduledDateTime,
                    ContextMeetingLink = latestInterview.ContextMeetingLink,
                    StatusIndicator = latestInterview.StatusIndicator.ToString(),
                },
        };
    }

    public async Task<AtsApplicationListItemDto> UpdateStatusAsync(
        Guid userId, Guid applicationId, UpdateApplicationStatusRequestDto dto, CancellationToken ct = default)
    {
        var company = await _companyRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Company profile not found.");

        var application = await _applicationRepo.GetTrackedCompanyApplicationAsync(company.Id, applicationId, ct)
            ?? throw new KeyNotFoundException("Application not found.");

        if (!Enum.TryParse<ApplicationStatus>(dto.NewStatus, ignoreCase: true, out var newStatus)
            || !Enum.IsDefined(newStatus))
        {
            throw new ValidationFailedException(
                "newStatus", "newStatus must be one of: Screened, Scheduled, Offered, Rejected.");
        }

        if (!AllowedTransitions.TryGetValue(application.ApplicationStatus, out var allowed)
            || !allowed.Contains(newStatus))
        {
            throw new InvalidStatusTransitionException();
        }

        if (newStatus == ApplicationStatus.Scheduled)
        {
            var errors = new Dictionary<string, string>();
            if (dto.ScheduledDateTime is null)
            {
                errors["scheduledDateTime"] = "A scheduled date and time is required.";
            }
            else if (dto.ScheduledDateTime.Value <= DateTimeOffset.UtcNow)
            {
                errors["scheduledDateTime"] = "The scheduled date and time must be in the future.";
            }

            if (string.IsNullOrWhiteSpace(dto.ContextMeetingLink))
            {
                errors["contextMeetingLink"] = "A meeting link is required.";
            }
            else if (!IsAbsoluteHttpUrl(dto.ContextMeetingLink))
            {
                errors["contextMeetingLink"] = "The meeting link must be a valid URL.";
            }

            if (errors.Count > 0)
            {
                throw new ValidationFailedException("Validation failed.", errors);
            }

            await _interviewRepo.AddAsync(new Interview
            {
                Id = Guid.NewGuid(),
                ApplicationId = application.Id,
                ScheduledDateTime = dto.ScheduledDateTime!.Value,
                ContextMeetingLink = dto.ContextMeetingLink!.Trim(),
                StatusIndicator = InterviewStatus.Scheduled,
            }, ct);
        }

        application.ApplicationStatus = newStatus;
        // Single SaveChanges commits the status change and any new Interview row atomically.
        await _applicationRepo.SaveChangesAsync(ct);

        return ToListItem(application);
    }

    private static AtsApplicationListItemDto ToListItem(Application application) =>
        new()
        {
            ApplicationId = application.Id,
            StudentName = FullName(application.Student),
            JobTitle = application.Job?.Title ?? string.Empty,
            ApplicationStatus = application.ApplicationStatus.ToString(),
            SubmittedAt = application.SubmittedAt,
        };

    private static string FullName(Student? student) =>
        student is null ? string.Empty : $"{student.FirstName} {student.LastName}".Trim();

    private static bool IsAbsoluteHttpUrl(string value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
}
