using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class UpdateApplicationStatusRequestDto
{
    [Required(ErrorMessage = "newStatus is required.")]
    public string NewStatus { get; set; } = string.Empty;

    // Required only when NewStatus is "Scheduled" — validated in the service.
    public DateTimeOffset? ScheduledDateTime { get; set; }
    public string? ContextMeetingLink { get; set; }
}
