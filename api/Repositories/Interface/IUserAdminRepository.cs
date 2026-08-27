using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface IUserAdminRepository
{
    Task<(IReadOnlyList<User> Items, int TotalCount)> GetPagedAsync(
        string? role, string? search, int page, int pageSize, CancellationToken ct = default);

    Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default);

    Task RevokeAllRefreshTokensAsync(Guid userId, CancellationToken ct = default);

    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
