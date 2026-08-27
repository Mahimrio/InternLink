using InternLinkApi.DTOs;
using InternLinkApi.Services.AdminService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Admin;

public class CompaniesController : AdminApiControllerBase
{
    private readonly IAdminCompanyService _companyService;

    public CompaniesController(IAdminCompanyService companyService)
    {
        _companyService = companyService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCompanies(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _companyService.GetCompaniesAsync(status, page, pageSize, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct = default)
    {
        try
        {
            await _companyService.ApproveAsync(CurrentUserId, id, ct);
            return Ok(new { message = "Company approved." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/reject")]
    public async Task<IActionResult> Reject(
        Guid id,
        [FromBody] RejectCompanyRequestDto? dto,
        CancellationToken ct = default)
    {
        try
        {
            await _companyService.RejectAsync(CurrentUserId, id, dto?.Reason, ct);
            return Ok(new { message = "Company rejected." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
