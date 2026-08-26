using InternLinkApi.DTOs;

namespace InternLinkApi.Services.AdminService;

public interface IAdminJobService
{
    Task<PagedResultDto<AdminJobDto>> GetJobsAsync(bool approved, int page, int pageSize, CancellationToken ct = default);

    Task ApproveAsync(Guid adminId, Guid jobId, CancellationToken ct = default);
}
