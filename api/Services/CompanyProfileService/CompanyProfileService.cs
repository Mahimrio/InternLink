using InternLinkApi.DTOs;
using InternLinkApi.Exceptions;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.CompanyProfileService;

public class CompanyProfileService : ICompanyProfileService
{
    private readonly ICompanyRepository _companyRepository;

    public CompanyProfileService(ICompanyRepository companyRepository)
    {
        _companyRepository = companyRepository;
    }

    public async Task<CompanyProfileDto?> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var company = await _companyRepository.GetByUserIdAsync(userId, ct);
        if (company is null) return null;

        return MapToDto(company);
    }

    public async Task<CompanyProfileDto> UpdateProfileAsync(Guid userId, UpdateCompanyProfileRequestDto dto, CancellationToken ct = default)
    {
        var company = await _companyRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Company profile not found.");

        var website = string.IsNullOrWhiteSpace(dto.CorporateWebsite) ? null : dto.CorporateWebsite.Trim();
        if (website is not null && !IsAbsoluteHttpUrl(website))
        {
            throw new ValidationFailedException(
                "corporateWebsite", "Corporate website must be a valid absolute URL (http or https).");
        }

        company.CompanyName = dto.CompanyName.Trim();
        company.CorporateWebsite = website;
        company.IndustrySector = dto.IndustrySector.Trim();
        // VerificationStatus is intentionally never touched here — only the Admin
        // verification endpoints (Prompt 26) may change it.

        await _companyRepository.UpdateAsync(company, ct);
        await _companyRepository.SaveChangesAsync(ct);

        return MapToDto(company);
    }

    private static bool IsAbsoluteHttpUrl(string value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);

    private static CompanyProfileDto MapToDto(Company company) =>
        new()
        {
            CompanyName = company.CompanyName,
            CorporateWebsite = company.CorporateWebsite,
            IndustrySector = company.IndustrySector,
            VerificationStatus = company.VerificationStatus.ToString(),
        };
}
