using InternLinkApi.Services.AdminService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Admin;

public class AnalyticsController : AdminApiControllerBase
{
    private readonly IAdminAnalyticsService _analyticsService;

    public AnalyticsController(IAdminAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnalytics(CancellationToken ct = default)
    {
        var analytics = await _analyticsService.GetAnalyticsAsync(ct);
        return Ok(analytics);
    }
}
