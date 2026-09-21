using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class MockInterviewSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid? JobId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string TranscriptJson { get; set; } = "[]";
    public MockInterviewStatus Status { get; set; } = MockInterviewStatus.InProgress;
    public string? ReportJson { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? CompletedAt { get; set; }

    public Student Student { get; set; } = null!;
    public Job? Job { get; set; }
}
