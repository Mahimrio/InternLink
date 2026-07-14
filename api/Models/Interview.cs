using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class Interview
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ApplicationId { get; set; }
    public DateTimeOffset ScheduledDateTime { get; set; }
    public string? ContextMeetingLink { get; set; }
    public InterviewStatus StatusIndicator { get; set; } = InterviewStatus.Scheduled;

    public Application Application { get; set; } = null!;
}
