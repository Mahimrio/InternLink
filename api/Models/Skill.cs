using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class Skill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string SkillName { get; set; } = string.Empty;
    public DomainClassification DomainClassification { get; set; }

    public ICollection<StudentSkill> StudentSkills { get; set; } = [];
    public ICollection<JobSkill> JobSkills { get; set; } = [];
    public ICollection<Assessment> Assessments { get; set; } = [];
}
