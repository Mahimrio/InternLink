using InternLinkApi.Services.AdminService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Admin;

public class JobsController : AdminApiControllerBase
{
    private readonly IAdminJobService _jobService;

    public JobsController(IAdminJobService jobService)
    {
        _jobService = jobService;
    }

    // Defaults to the pending queue (approved=false).
    [HttpGet]
    public async Task<IActionResult> GetJobs(
        [FromQuery] bool approved = false,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _jobService.GetJobsAsync(approved, page, pageSize, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/approve")]
    public async Task<IActionResult> Approve(Guid id, CancellationToken ct = default)
    {
        try
        {
            await _jobService.ApproveAsync(CurrentUserId, id, ct);
            return Ok(new { message = "Job approved." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
