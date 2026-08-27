namespace InternLinkApi.DTOs;

// Read-only reference data for populating the job-posting skills multi-select.
public class SkillOptionDto
{
    public Guid Id { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public string DomainClassification { get; set; } = string.Empty;
}
