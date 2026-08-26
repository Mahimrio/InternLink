using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.Extensions.Logging;

namespace InternLinkApi.Services.AdminService;

public class AdminUserService : IAdminUserService
{
    private readonly IUserAdminRepository _userRepo;
    private readonly ILogger<AdminUserService> _logger;

    public AdminUserService(IUserAdminRepository userRepo, ILogger<AdminUserService> logger)
    {
        _userRepo = userRepo;
        _logger = logger;
    }

    public async Task<PagedResultDto<AdminUserDto>> GetUsersAsync(
        string? role, string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var (users, totalCount) = await _userRepo.GetPagedAsync(role, search, page, pageSize, ct);
        var items = users.Select(ToDto).ToList();
        return new PagedResultDto<AdminUserDto>(items, totalCount, page, pageSize);
    }

    public async Task SuspendAsync(Guid adminId, Guid userId, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsActive = false;
        // Revoke active refresh tokens so an already-logged-in session can't refresh past the suspension.
        await _userRepo.RevokeAllRefreshTokensAsync(userId, ct);
        await _userRepo.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Admin {AdminId} performed {Action} on {TargetType}:{TargetId} at {Timestamp}",
            adminId, "SuspendUser", "User", userId, DateTimeOffset.UtcNow);
    }

    public async Task ReactivateAsync(Guid adminId, Guid userId, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("User not found.");

        user.IsActive = true;
        await _userRepo.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Admin {AdminId} performed {Action} on {TargetType}:{TargetId} at {Timestamp}",
            adminId, "ReactivateUser", "User", userId, DateTimeOffset.UtcNow);
    }

    private static AdminUserDto ToDto(User user) =>
        new()
        {
            Id = user.Id,
            Email = user.Email ?? string.Empty,
            DisplayName = ResolveDisplayName(user),
            Role = user.Role?.Name ?? string.Empty,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt,
        };

    private static string ResolveDisplayName(User user)
    {
        if (user.Student is not null)
        {
            return $"{user.Student.FirstName} {user.Student.LastName}".Trim();
        }

        if (user.Company is not null)
        {
            return user.Company.CompanyName;
        }

        return user.UserName ?? user.Email ?? string.Empty;
    }
}
