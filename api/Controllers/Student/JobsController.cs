using InternLinkApi.DTOs;
using InternLinkApi.Services.JobService;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Controllers.Student;

public class JobsController : StudentApiControllerBase
{
    private readonly IJobService _jobService;

    public JobsController(IJobService jobService)
    {
        _jobService = jobService;
    }

    [HttpGet]
    public async Task<IActionResult> GetJobs(
        [FromQuery] string? locationType,
        [FromQuery] string? keyword,
        [FromQuery] bool? relevantToMe,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        try
        {
            var paged = await _jobService.GetPagedJobsForStudentAsync(
                CurrentUserId, locationType, keyword, relevantToMe, page, pageSize, ct);
            return Ok(paged);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetJobById(Guid id, CancellationToken ct = default)
    {
        try
        {
            var job = await _jobService.GetJobDetailsForStudentAsync(CurrentUserId, id, ct);
            if (job is null)
            {
                return NotFound(new { error = "Job not found or is no longer available." });
            }

            return Ok(job);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/apply")]
    public async Task<IActionResult> Apply(
        Guid id,
        [FromBody] ApplyJobRequestDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        try
        {
            var application = await _jobService.ApplyToJobAsync(CurrentUserId, id, dto.ResumeId, ct);
            return StatusCode(201, application);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            if (ex.Message.Contains("already applied", StringComparison.OrdinalIgnoreCase))
            {
                return Conflict(new { error = "You have already applied to this job" });
            }
            return BadRequest(new { error = ex.Message });
        }
        catch (DbUpdateException)
        {
            return Conflict(new { error = "You have already applied to this job" });
        }
    }
}
