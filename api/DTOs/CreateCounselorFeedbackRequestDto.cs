using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class CreateCounselorFeedbackRequestDto
{
    [Required(ErrorMessage = "Advising narrative is required.")]
    [MaxLength(5000, ErrorMessage = "Advising narrative cannot exceed 5000 characters.")]
    public string NarrativeMarkdown { get; set; } = string.Empty;

    [Required(ErrorMessage = "Meeting date is required.")]
    public DateTimeOffset MeetingDate { get; set; }
}
