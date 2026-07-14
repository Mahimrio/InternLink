namespace InternLinkApi.Models;

public class StudentSkill
{
    public Guid StudentId { get; set; }
    public Guid SkillId { get; set; }

    /// <summary>Self-reported proficiency from 1 (beginner) to 5 (expert).</summary>
    public int ProficiencyLevel { get; set; }

    public Student Student { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
