using InternLinkApi.Services.JobService;
using Microsoft.AspNetCore.Mvc;

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
        CancellationToken ct)
    {
        var jobs = await _jobService.GetActiveJobsForStudentAsync(
            CurrentUserId, locationType, keyword, ct);
        return Ok(jobs);
    }
}
