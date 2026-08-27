namespace InternLinkApi.DTOs;

// The company's own management view of a job — unlike the student-facing JobDto,
// it exposes approval/closed state so the company can see where each posting stands.
public class CompanyJobDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoreDescription { get; set; } = string.Empty;
    public string SelectionCriteria { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public DateTimeOffset DeadLine { get; set; }
    public bool IsApproved { get; set; }
    public bool IsClosed { get; set; }
    public List<JobSkillDto> RequiredSkills { get; set; } = [];
}
