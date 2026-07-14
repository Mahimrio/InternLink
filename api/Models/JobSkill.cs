namespace InternLinkApi.Models;

public class JobSkill
{
    public Guid JobId { get; set; }
    public Guid SkillId { get; set; }

    /// <summary>How critical this skill is for the role, from 1 (nice-to-have) to 5 (required).</summary>
    public int RequiredImportanceWeight { get; set; }

    public Job Job { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
