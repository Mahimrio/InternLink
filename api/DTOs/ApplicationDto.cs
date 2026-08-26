namespace InternLinkApi.DTOs;

public class ApplicationDto
{
    public Guid Id { get; set; }
    public Guid JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string ApplicationStatus { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }
    public Guid? AttachedResumeId { get; set; }
}
