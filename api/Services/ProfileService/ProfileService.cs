using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.ProfileService;

public class ProfileService : IProfileService
{
    private readonly IStudentRepository _studentRepository;

    public ProfileService(IStudentRepository studentRepository)
    {
        _studentRepository = studentRepository;
    }

    public async Task<ProfileDto?> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct);
        if (student is null) return null;

        return MapToDto(student);
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

        return MapToDto(student);
    }

    private static ProfileDto MapToDto(Student student) =>
        new(
            student.FirstName,
            student.LastName,
            student.CGPA,
            student.InstitutionalId,
            student.Department,
            student.Biography,
            student.Interests
        );
}
