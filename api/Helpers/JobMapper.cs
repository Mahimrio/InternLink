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
            CompanyName = job.Company?.CompanyName ?? string.Empty,
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
        };
    }

    public static List<JobDto> ToDtoList(IEnumerable<Job> jobs, HashSet<Guid>? appliedJobIds = null)
    {
        return jobs.Select(j => ToDto(j, appliedJobIds?.Contains(j.Id) ?? false)).ToList();
    }

    public static ApplicationDto ToDto(Application application)
    {
        return new ApplicationDto
        {
            Id = application.Id,
            JobId = application.JobId,
            JobTitle = application.Job?.Title ?? string.Empty,
            CompanyName = application.Job?.Company?.CompanyName ?? string.Empty,
            ApplicationStatus = application.ApplicationStatus.ToString(),
            SubmittedAt = application.SubmittedAt,
            AttachedResumeId = application.AttachedResumeId,
        };
    }

    public static List<ApplicationDto> ToDtoList(IEnumerable<Application> applications)
    {
        return applications.Select(ToDto).ToList();
    }
}
