using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class Application
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobId { get; set; }
    public Guid StudentId { get; set; }
    public DateTimeOffset SubmittedAt { get; set; } = DateTimeOffset.UtcNow;
    public ApplicationStatus ApplicationStatus { get; set; } = ApplicationStatus.Applied;
    public Guid? AttachedResumeId { get; set; }

    public Job Job { get; set; } = null!;
    public Student Student { get; set; } = null!;
    public Resume? AttachedResume { get; set; }
    public ICollection<Interview> Interviews { get; set; } = [];
}
