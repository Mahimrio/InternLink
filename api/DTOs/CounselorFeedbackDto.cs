namespace InternLinkApi.DTOs;

public record CounselorFeedbackDto(
    Guid Id,
    Guid StudentId,
    Guid CounselorUserId,
    string? CounselorEmail,
    string NarrativeMarkdown,
    DateTimeOffset MeetingDate,
    DateTimeOffset CreatedAt
);
