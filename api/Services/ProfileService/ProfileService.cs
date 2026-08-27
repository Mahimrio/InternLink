using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.ProfileService;

public class ProfileService : IProfileService
{
    private readonly IStudentRepository _studentRepository;
    private readonly IAssessmentRepository _assessmentRepository;

    public ProfileService(IStudentRepository studentRepository, IAssessmentRepository assessmentRepository)
    {
        _studentRepository = studentRepository;
        _assessmentRepository = assessmentRepository;
    }

    public async Task<ProfileDto?> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct);
        if (student is null) return null;

        var verifiedSkills = await _assessmentRepository.GetVerifiedSkillNamesForStudentAsync(student.Id, ct);
        return MapToDto(student, verifiedSkills);
    }

    public async Task<ProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto dto, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        // Defensive check: InstitutionalId must not be changed post-registration
        if (!string.IsNullOrWhiteSpace(dto.InstitutionalId) &&
            !string.Equals(dto.InstitutionalId, student.InstitutionalId, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Institutional ID cannot be modified post-registration.");
        }

        student.FirstName = dto.FirstName;
        student.LastName = dto.LastName;
        student.CGPA = dto.CGPA;
        student.Department = dto.Department;
        student.Biography = dto.Biography;
        student.Interests = dto.Interests;

        await _studentRepository.UpdateAsync(student, ct);
        await _studentRepository.SaveChangesAsync(ct);

        var verifiedSkills = await _assessmentRepository.GetVerifiedSkillNamesForStudentAsync(student.Id, ct);
        return MapToDto(student, verifiedSkills);
    }

    private static ProfileDto MapToDto(Student student, IReadOnlyList<string> verifiedSkills) =>
        new(
            student.FirstName,
            student.LastName,
            student.CGPA,
            student.InstitutionalId,
            student.Department,
            student.Biography,
            student.Interests,
            verifiedSkills
        );
}
