using InternLinkApi.DTOs;

namespace InternLinkApi.Services.AdminService;

public interface IAdminCompanyService
{
    Task<PagedResultDto<AdminCompanyDto>> GetCompaniesAsync(
        string? status, int page, int pageSize, CancellationToken ct = default);

    Task ApproveAsync(Guid adminId, Guid companyId, CancellationToken ct = default);

    Task RejectAsync(Guid adminId, Guid companyId, string? reason, CancellationToken ct = default);
}
