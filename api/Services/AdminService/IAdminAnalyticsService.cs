using InternLinkApi.DTOs;

namespace InternLinkApi.Services.AdminService;

public interface IAdminAnalyticsService
{
    Task<AdminAnalyticsDto> GetAnalyticsAsync(CancellationToken ct = default);
}
