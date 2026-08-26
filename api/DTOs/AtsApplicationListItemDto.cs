namespace InternLinkApi.DTOs;

// One row in the company's ATS pipeline list.
public class AtsApplicationListItemDto
{
    public Guid ApplicationId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string ApplicationStatus { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }
    public int VerifiedSkillCount { get; set; }
}
