using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.JobService;
using InternLinkApi.Services.ProfileService;
using InternLinkApi.Services.ResumeService;

namespace InternLinkApi.Services.CounselorAdvisingService;

public class CounselorAdvisingService : ICounselorAdvisingService
{
    private readonly IStudentRepository _studentRepository;
    private readonly ICounselorFeedbackRepository _feedbackRepository;
    private readonly IProfileService _profileService;
    private readonly IResumeService _resumeService;
    private readonly IJobService _jobService;

    public CounselorAdvisingService(
        IStudentRepository studentRepository,
        ICounselorFeedbackRepository feedbackRepository,
        IProfileService profileService,
        IResumeService resumeService,
        IJobService jobService)
    {
        _studentRepository = studentRepository;
        _feedbackRepository = feedbackRepository;
        _profileService = profileService;
        _resumeService = resumeService;
        _jobService = jobService;
    }

    public async Task<IReadOnlyList<CounselorStudentSummaryDto>> GetStudentsAsync(string? search, CancellationToken ct = default)
    {
        return await _studentRepository.GetCounselorStudentSummariesAsync(search, ct);
    }

    public async Task<CounselorStudentDetailDto?> GetStudentDetailAsync(Guid studentId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByIdWithUserAsync(studentId, ct);
        if (student is null) return null;

        // Reusing existing profile, resume, and application query services per AGENTS.md
        var profile = await _profileService.GetProfileAsync(student.UserId, ct);
        var resumes = await _resumeService.GetResumesAsync(student.UserId, ct);
        var applications = await _jobService.GetStudentApplicationsAsync(student.UserId, null, ct);

        var fallbackProfile = profile ?? new ProfileDto(
            student.FirstName,
            student.LastName,
            student.CGPA,
            student.InstitutionalId,
            student.Department,
            student.Biography,
            student.Interests,
            Array.Empty<string>()
        );

        return new CounselorStudentDetailDto(
            student.Id,
            student.UserId,
            fallbackProfile,
            resumes,
            applications
        );
    }

    public async Task<CounselorFeedbackDto> CreateFeedbackAsync(
        Guid counselorUserId,
        Guid studentId,
        CreateCounselorFeedbackRequestDto dto,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.NarrativeMarkdown))
        {
            throw new ArgumentException("Advising narrative is required.");
        }

        if (dto.NarrativeMarkdown.Length > 5000)
        {
            throw new ArgumentException("Advising narrative cannot exceed 5000 characters.");
        }

        var student = await _studentRepository.GetByIdAsync(studentId, ct)
            ?? throw new KeyNotFoundException("Student not found.");

        var feedback = new CounselorFeedback
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            CounselorUserId = counselorUserId,
            NarrativeMarkdown = dto.NarrativeMarkdown.Trim(),
            MeetingDate = dto.MeetingDate
        };

        await _feedbackRepository.AddAsync(feedback, ct);
        await _feedbackRepository.SaveChangesAsync(ct);

        return new CounselorFeedbackDto(
            feedback.Id,
            feedback.StudentId,
            feedback.CounselorUserId,
            null,
            feedback.NarrativeMarkdown,
            feedback.MeetingDate,
            feedback.MeetingDate
        );
    }

    public async Task<IReadOnlyList<CounselorFeedbackDto>> GetStudentFeedbackHistoryAsync(Guid studentId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByIdAsync(studentId, ct)
            ?? throw new KeyNotFoundException("Student not found.");

        var feedbacks = await _feedbackRepository.GetFeedbackByStudentIdAsync(student.Id, ct);

        return feedbacks.Select(f => new CounselorFeedbackDto(
            f.Id,
            f.StudentId,
            f.CounselorUserId,
            f.CounselorUser?.Email,
            f.NarrativeMarkdown,
            f.MeetingDate,
            f.MeetingDate
        )).ToList();
    }

    public async Task<IReadOnlyList<CounselorFeedbackDto>> GetStudentOwnFeedbackAsync(Guid studentUserId, CancellationToken ct = default)
    {
        var feedbacks = await _feedbackRepository.GetFeedbackByStudentUserIdAsync(studentUserId, ct);

        return feedbacks.Select(f => new CounselorFeedbackDto(
            f.Id,
            f.StudentId,
            f.CounselorUserId,
            f.CounselorUser?.Email,
            f.NarrativeMarkdown,
            f.MeetingDate,
            f.MeetingDate
        )).ToList();
    }
}
