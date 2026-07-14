namespace InternLinkApi.Models;

public class Assessment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid SkillId { get; set; }
    public int AchievedScore { get; set; }
    public DateTimeOffset EarnedDate { get; set; } = DateTimeOffset.UtcNow;

    public Student Student { get; set; } = null!;
    public Skill Skill { get; set; } = null!;
}
