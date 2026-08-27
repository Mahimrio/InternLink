using InternLinkApi.DTOs;

namespace InternLinkApi.Services.CompanyProfileService;

public interface ICompanyProfileService
{
    Task<CompanyProfileDto?> GetProfileAsync(Guid userId, CancellationToken ct = default);

    Task<CompanyProfileDto> UpdateProfileAsync(Guid userId, UpdateCompanyProfileRequestDto dto, CancellationToken ct = default);
}
