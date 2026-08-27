using InternLinkApi.DTOs;
using InternLinkApi.Helpers;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.JobService;

public class JobService : IJobService
{
    private readonly IJobRepository _jobRepo;
    private readonly IApplicationRepository _applicationRepo;
    private readonly IStudentRepository _studentRepo;
    private readonly IResumeRepository _resumeRepo;

    public JobService(
        IJobRepository jobRepo,
        IApplicationRepository applicationRepo,
        IStudentRepository studentRepo,
        IResumeRepository resumeRepo)
    {
        _jobRepo = jobRepo;
        _applicationRepo = applicationRepo;
        _studentRepo = studentRepo;
        _resumeRepo = resumeRepo;
    }

    public async Task<PagedResultDto<JobDto>> GetPagedJobsForStudentAsync(
        Guid userId,
        string? locationType,
        string? keyword,
        bool? relevantToMe,
        int page,
        int pageSize,
        CancellationToken ct = default)
    {
        var student = await _studentRepo.GetWithSkillsByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        IReadOnlyCollection<Guid>? relevantSkillIds = null;
        if (relevantToMe == true)
        {
            relevantSkillIds = student.StudentSkills.Select(ss => ss.SkillId).ToList();
        }

        var (jobs, totalCount) = await _jobRepo.SearchApprovedOpenJobsAsync(
            locationType, keyword, relevantSkillIds, page, pageSize, ct);

        var appliedJobIds = await _applicationRepo.GetAppliedJobIdsForStudentAsync(student.Id, ct);

        var jobDtos = JobMapper.ToDtoList(jobs, appliedJobIds);

        return new PagedResultDto<JobDto>(jobDtos, totalCount, page, pageSize);
    }

    public async Task<JobDto?> GetJobDetailsForStudentAsync(Guid userId, Guid jobId, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var job = await _jobRepo.GetApprovedOpenJobByIdAsync(jobId, ct);
        if (job is null)
        {
            return null;
        }

        var hasApplied = await _applicationRepo.ExistsAsync(jobId, student.Id, ct);
        return JobMapper.ToDto(job, hasApplied);
    }

    public async Task<ApplicationDto> ApplyToJobAsync(Guid userId, Guid jobId, Guid resumeId, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var job = await _jobRepo.GetApprovedOpenJobByIdAsync(jobId, ct);
        if (job is null)
        {
            throw new KeyNotFoundException("Job not found or is no longer accepting applications.");
        }

        var resume = await _resumeRepo.GetByIdAndStudentIdAsync(resumeId, student.Id, ct);
        if (resume is null)
        {
            throw new KeyNotFoundException("Resume not found.");
        }

        if (string.IsNullOrWhiteSpace(resume.DocumentPath))
        {
            throw new InvalidOperationException("Resume must be finalized before applying.");
        }

        var alreadyApplied = await _applicationRepo.ExistsAsync(jobId, student.Id, ct);
        if (alreadyApplied)
        {
            throw new InvalidOperationException("You have already applied to this job");
        }

        var application = new Application
        {
            Id = Guid.NewGuid(),
            JobId = jobId,
            StudentId = student.Id,
            AttachedResumeId = resumeId,
            ApplicationStatus = ApplicationStatus.Applied,
            SubmittedAt = DateTimeOffset.UtcNow,
        };

        await _applicationRepo.AddAsync(application, ct);
        await _applicationRepo.SaveChangesAsync(ct);

        return new ApplicationDto
        {
            Id = application.Id,
            JobId = job.Id,
            JobTitle = job.Title,
            CompanyName = job.Company?.CompanyName ?? string.Empty,
            ApplicationStatus = application.ApplicationStatus.ToString(),
            SubmittedAt = application.SubmittedAt,
            AttachedResumeId = application.AttachedResumeId,
        };
    }

    public async Task<IReadOnlyList<ApplicationDto>> GetStudentApplicationsAsync(
        Guid userId, string? status, CancellationToken ct = default)
    {
        var student = await _studentRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        ApplicationStatus? parsedStatus = null;
        if (!string.IsNullOrWhiteSpace(status)
            && Enum.TryParse<ApplicationStatus>(status, ignoreCase: true, out var s))
        {
            parsedStatus = s;
        }

        var applications = await _applicationRepo.GetStudentApplicationsWithDetailsAsync(student.Id, parsedStatus, ct);
        return JobMapper.ToDtoList(applications);
    }

    public async Task<IReadOnlyList<JobDto>> GetActiveJobsForStudentAsync(
        Guid userId, string? locationType, string? keyword, CancellationToken ct = default)
    {
        var result = await GetPagedJobsForStudentAsync(userId, locationType, keyword, null, 1, 50, ct);
        return result.Items;
    }
}
