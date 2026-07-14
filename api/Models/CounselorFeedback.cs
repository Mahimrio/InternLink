namespace InternLinkApi.Models;

public class CounselorFeedback
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid CounselorUserId { get; set; }
    public string NarrativeMarkdown { get; set; } = string.Empty;
    public DateTimeOffset MeetingDate { get; set; }

    public Student Student { get; set; } = null!;
    public User CounselorUser { get; set; } = null!;
}
