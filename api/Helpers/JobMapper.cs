using InternLinkApi.DTOs;
using InternLinkApi.Models;

namespace InternLinkApi.Helpers;

public static class JobMapper
{
    public static JobDto ToDto(Job job, bool hasApplied = false)
    {
        return new JobDto
        {
            Id = job.Id,
            CompanyId = job.CompanyId,
            // For internal jobs: use the related Company entity name.
            // For external jobs: fall back to the snapshot stored at ingestion time.
            CompanyName = job.Company?.CompanyName ?? job.CompanyNameSnapshot ?? string.Empty,
            Title = job.Title,
            CoreDescription = job.CoreDescription,
            SelectionCriteria = job.SelectionCriteria,
            LocationType = job.LocationType.ToString(),
            DeadLine = job.DeadLine,
            HasApplied = hasApplied,
            RequiredSkills = job.JobSkills?.Select(js => new JobSkillDto
            {
                SkillName = js.Skill?.SkillName ?? string.Empty,
                RequiredImportanceWeight = js.RequiredImportanceWeight,
            }).ToList() ?? [],
            Source = job.Source.ToString(),
            ExternalSourceName = job.ExternalSourceName,
            ExternalApplyUrl = job.ExternalApplyUrl,
        };
    }

    public static List<JobDto> ToDtoList(IEnumerable<Job> jobs, HashSet<Guid>? appliedJobIds = null)
    {
        return jobs.Select(j => ToDto(j, appliedJobIds?.Contains(j.Id) ?? false)).ToList();
    }

    public static CompanyJobDto ToCompanyDto(Job job)
    {
        return new CompanyJobDto
        {
            Id = job.Id,
            Title = job.Title,
            CoreDescription = job.CoreDescription,
            SelectionCriteria = job.SelectionCriteria,
            LocationType = job.LocationType.ToString(),
            DeadLine = job.DeadLine,
            IsApproved = job.IsApproved,
            IsClosed = job.IsClosed,
            RequiredSkills = job.JobSkills?.Select(js => new JobSkillDto
            {
                SkillName = js.Skill?.SkillName ?? string.Empty,
                RequiredImportanceWeight = js.RequiredImportanceWeight,
            }).ToList() ?? [],
        };
    }

    public static List<CompanyJobDto> ToCompanyDtoList(IEnumerable<Job> jobs)
    {
        return jobs.Select(ToCompanyDto).ToList();
    }

    public static ApplicationDto ToDto(Application application)
    {
        return new ApplicationDto
        {
            Id = application.Id,
            JobId = application.JobId,
            JobTitle = application.Job?.Title ?? string.Empty,
            CompanyName = application.Job?.Company?.CompanyName
                          ?? application.Job?.CompanyNameSnapshot
                          ?? string.Empty,
            ApplicationStatus = application.ApplicationStatus.ToString(),
            SubmittedAt = application.SubmittedAt,
            AttachedResumeId = application.AttachedResumeId,
        };
    }

    public static List<ApplicationDto> ToDtoList(IEnumerable<Application> applications)
    {
        return applications.Select(ToDto).ToList();
    }

    /// <summary>Maps a Job entity to the Admin moderation DTO.</summary>
    public static AdminJobDto ToAdminDto(Job job)
    {
        return new AdminJobDto
        {
            Id = job.Id,
            Title = job.Title,
            CompanyName = job.Company?.CompanyName ?? job.CompanyNameSnapshot ?? string.Empty,
            Description = job.CoreDescription,
            LocationType = job.LocationType.ToString(),
            DeadLine = job.DeadLine,
            IsApproved = job.IsApproved,
            IsClosed = job.IsClosed,
            Source = job.Source.ToString(),
            ExternalSourceName = job.ExternalSourceName,
            ExternalApplyUrl = job.ExternalApplyUrl,
        };
    }
}
