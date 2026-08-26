using InternLinkApi.DTOs;
using InternLinkApi.Exceptions;
using InternLinkApi.Models.Enums;
using InternLinkApi.Services.CompanyJobService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Company;

public class JobsController : CompanyApiControllerBase
{
    private readonly ICompanyJobService _jobService;

    public JobsController(ICompanyJobService jobService)
    {
        _jobService = jobService;
    }

    [HttpGet]
    public async Task<IActionResult> GetOwnJobs(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        // Read-only management view: a Pending company can still see its own jobs (all statuses).
        try
        {
            var result = await _jobService.GetCompanyJobsAsync(CurrentUserId, page, pageSize, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetJob(Guid id, CancellationToken ct = default)
    {
        // Read-only: fetching a single owned job (e.g. to populate the edit form).
        try
        {
            var job = await _jobService.GetCompanyJobByIdAsync(CurrentUserId, id, ct);
            if (job is null)
            {
                return NotFound(new { error = "Job not found." });
            }

            return Ok(job);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobRequestDto dto, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        var (error, companyId) = await EnsureVerifiedAsync(ct);
        if (error is not null) return error;

        try
        {
            var created = await _jobService.CreateJobAsync(companyId, dto, ct);
            return StatusCode(201, created);
        }
        catch (ValidationFailedException ex)
        {
            return BadRequest(new { error = ex.Message, details = ex.Errors });
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateJob(Guid id, [FromBody] CreateJobRequestDto dto, CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        var (error, companyId) = await EnsureVerifiedAsync(ct);
        if (error is not null) return error;

        try
        {
            var updated = await _jobService.UpdateJobAsync(companyId, id, dto, ct);
            return Ok(updated);
        }
        catch (ForbiddenActionException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ValidationFailedException ex)
        {
            return BadRequest(new { error = ex.Message, details = ex.Errors });
        }
    }

    [HttpPost("{id:guid}/close")]
    public async Task<IActionResult> CloseJob(Guid id, CancellationToken ct = default)
    {
        var (error, companyId) = await EnsureVerifiedAsync(ct);
        if (error is not null) return error;

        try
        {
            var closed = await _jobService.CloseJobAsync(companyId, id, ct);
            return Ok(closed);
        }
        catch (ForbiddenActionException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    // Called at the top of every mutating action. Read-only actions skip it so a Pending
    // company can still see its own jobs. Returns a clear 403 (never a 500) when unverified.
    private async Task<(IActionResult? Error, Guid CompanyId)> EnsureVerifiedAsync(CancellationToken ct)
    {
        var context = await _jobService.GetVerificationContextAsync(CurrentUserId, ct);
        if (context is null)
        {
            return (NotFound(new { error = "Company profile not found." }), Guid.Empty);
        }

        if (context.Status != VerificationStatus.Verified)
        {
            return (StatusCode(403, new { error = "Your company must be verified before posting jobs" }), Guid.Empty);
        }

        return (null, context.CompanyId);
    }
}
