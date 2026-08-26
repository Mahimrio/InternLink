using InternLinkApi.DTOs;

namespace InternLinkApi.Services.AdminService;

public interface IAdminUserService
{
    Task<PagedResultDto<AdminUserDto>> GetUsersAsync(
        string? role, string? search, int page, int pageSize, CancellationToken ct = default);

    Task SuspendAsync(Guid adminId, Guid userId, CancellationToken ct = default);

    Task ReactivateAsync(Guid adminId, Guid userId, CancellationToken ct = default);
}
