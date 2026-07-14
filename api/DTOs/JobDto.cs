namespace InternLinkApi.DTOs;

public class JobDto
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string CoreDescription { get; set; } = string.Empty;
    public string SelectionCriteria { get; set; } = string.Empty;
    public string LocationType { get; set; } = string.Empty;
    public DateTimeOffset DeadLine { get; set; }
    public List<JobSkillDto> RequiredSkills { get; set; } = [];
}

public class JobSkillDto
{
    public string SkillName { get; set; } = string.Empty;
    public int RequiredImportanceWeight { get; set; }
}
