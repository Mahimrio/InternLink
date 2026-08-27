namespace InternLinkApi.DTOs;

public record CounselorStudentDetailDto(
    Guid StudentId,
    Guid UserId,
    ProfileDto Profile,
    IReadOnlyList<ResumeDto> Resumes,
    IReadOnlyList<ApplicationDto> Applications
);
