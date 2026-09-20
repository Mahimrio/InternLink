using InternLinkApi.DTOs;
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

    // GET /api/admin/jobs?approved=false&page=1&pageSize=20
    // Defaults to the pending moderation queue (approved=false).
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

    // POST /api/admin/jobs/{id}/approve
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

    // ── External job management ──────────────────────────────────────────────

    // POST /api/admin/jobs/external/sync
    // Triggers an on-demand sync from all configured external portals.
    [HttpPost("external/sync")]
    public async Task<IActionResult> SyncExternal(CancellationToken ct = default)
    {
        try
        {
            var result = await _jobService.SyncExternalJobsAsync(CurrentUserId, ct);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { error = "Sync failed. See server logs for details.", detail = ex.Message });
        }
    }

    // POST /api/admin/jobs/external
    // Manually creates a single external job (not from the automated pipeline).
    [HttpPost("external")]
    public async Task<IActionResult> CreateExternalJob(
        [FromBody] CreateExternalJobRequestDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        try
        {
            var job = await _jobService.CreateExternalJobAsync(CurrentUserId, dto, ct);
            return StatusCode(201, job);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    // POST /api/admin/jobs/external/parse
    // AI smart-paste: extracts structured fields from raw pasted job description text.
    [HttpPost("external/parse")]
    public async Task<IActionResult> ParseExternalJob(
        [FromBody] ParseExternalJobRequestDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        var result = await _jobService.ParseExternalJobWithAiAsync(CurrentUserId, dto, ct);
        return Ok(result);
    }
}
