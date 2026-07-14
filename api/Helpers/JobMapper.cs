using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;

namespace InternLinkApi.Helpers;

public static class JobMapper
{
    public static JobDto ToDto(Job job)
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
            RequiredSkills = job.JobSkills?.Select(js => new JobSkillDto
            {
                SkillName = js.Skill?.SkillName ?? string.Empty,
                RequiredImportanceWeight = js.RequiredImportanceWeight,
            }).ToList() ?? [],
        };
    }

    public static List<JobDto> ToDtoList(IEnumerable<Job> jobs)
    {
        return jobs.Select(ToDto).ToList();
    }
}
