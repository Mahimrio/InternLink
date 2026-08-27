namespace InternLinkApi.DTOs;

// Recruiter-facing applicant detail — only the fields relevant to screening,
// not the student's full profile.
public class AtsApplicantDetailDto
{
    public Guid ApplicationId { get; set; }
    public Guid JobId { get; set; }
    public string JobTitle { get; set; } = string.Empty;
    public string ApplicationStatus { get; set; } = string.Empty;
    public DateTimeOffset SubmittedAt { get; set; }

    public string StudentName { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public decimal Cgpa { get; set; }

    public string? ResumeDownloadUrl { get; set; }
    public List<string> VerifiedSkills { get; set; } = [];

    public AtsInterviewDto? Interview { get; set; }
}

public class AtsInterviewDto
{
    public DateTimeOffset ScheduledDateTime { get; set; }
    public string? ContextMeetingLink { get; set; }
    public string StatusIndicator { get; set; } = string.Empty;
}
