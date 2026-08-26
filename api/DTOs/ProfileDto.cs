namespace InternLinkApi.DTOs;

public record ProfileDto(
    string FirstName,
    string LastName,
    decimal CGPA,
    string InstitutionalId,
    string Department,
    string? Biography,
    string? Interests,
    IReadOnlyList<string> VerifiedSkills
);
