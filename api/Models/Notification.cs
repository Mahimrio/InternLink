namespace InternLinkApi.Models;

public class Notification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TargetUserId { get; set; }
    public string TextPayload { get; set; } = string.Empty;
    public string EventRoutingUrl { get; set; } = string.Empty;
    public bool IsRead { get; set; } = false;
    public DateTimeOffset TimeTriggered { get; set; } = DateTimeOffset.UtcNow;

    public User TargetUser { get; set; } = null!;
}
