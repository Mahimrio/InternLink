using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using Microsoft.Extensions.Logging;

namespace InternLinkApi.Services.AdminService;

public class AdminCompanyService : IAdminCompanyService
{
    private readonly ICompanyRepository _companyRepo;
    private readonly ILogger<AdminCompanyService> _logger;

    public AdminCompanyService(ICompanyRepository companyRepo, ILogger<AdminCompanyService> logger)
    {
        _companyRepo = companyRepo;
        _logger = logger;
    }

    public async Task<PagedResultDto<AdminCompanyDto>> GetCompaniesAsync(
        string? status, int page, int pageSize, CancellationToken ct = default)
    {
        // Default to the Pending review queue; "all" returns every status.
        VerificationStatus? filter = VerificationStatus.Pending;
        if (!string.IsNullOrWhiteSpace(status))
        {
            if (status.Equals("all", StringComparison.OrdinalIgnoreCase))
            {
                filter = null;
            }
            else if (Enum.TryParse<VerificationStatus>(status, ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
            {
                filter = parsed;
            }
        }

        var (companies, totalCount) = await _companyRepo.GetPagedByStatusAsync(filter, page, pageSize, ct);
        var items = companies.Select(ToDto).ToList();
        return new PagedResultDto<AdminCompanyDto>(items, totalCount, page, pageSize);
    }

    public async Task ApproveAsync(Guid adminId, Guid companyId, CancellationToken ct = default)
    {
        var company = await _companyRepo.GetByIdAsync(companyId, ct)
            ?? throw new KeyNotFoundException("Company not found.");

        company.VerificationStatus = VerificationStatus.Verified;
        await _companyRepo.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Admin {AdminId} performed {Action} on {TargetType}:{TargetId} at {Timestamp}",
            adminId, "ApproveCompany", "Company", companyId, DateTimeOffset.UtcNow);
    }

    public async Task RejectAsync(Guid adminId, Guid companyId, string? reason, CancellationToken ct = default)
    {
        var company = await _companyRepo.GetByIdAsync(companyId, ct)
            ?? throw new KeyNotFoundException("Company not found.");

        company.VerificationStatus = VerificationStatus.Rejected;
        await _companyRepo.SaveChangesAsync(ct);

        // Reason is logged for now so the company can be given an explanation (a persisted
        // rejection-reason field is a reasonable stretch goal).
        _logger.LogInformation(
            "Admin {AdminId} performed {Action} on {TargetType}:{TargetId} at {Timestamp}. Reason: {Reason}",
            adminId, "RejectCompany", "Company", companyId, DateTimeOffset.UtcNow,
            string.IsNullOrWhiteSpace(reason) ? "(none provided)" : reason);
    }

    private static AdminCompanyDto ToDto(Company company) =>
        new()
        {
            Id = company.Id,
            CompanyName = company.CompanyName,
            CorporateWebsite = company.CorporateWebsite,
            IndustrySector = company.IndustrySector,
            VerificationStatus = company.VerificationStatus.ToString(),
            ContactEmail = company.User?.Email ?? string.Empty,
            CreatedAt = company.User?.CreatedAt ?? default,
        };
}
