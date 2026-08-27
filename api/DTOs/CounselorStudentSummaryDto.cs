namespace InternLinkApi.DTOs;

public record CounselorStudentSummaryDto(
    Guid StudentId,
    string FullName,
    decimal CGPA,
    string Department,
    string InstitutionalId,
    int ResumeCount,
    int ApplicationCount
);
