using InternLinkApi.Services.JobService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

[Route("api/student/[controller]")]
public class ApplicationsController : StudentApiControllerBase
{
    private readonly IJobService _jobService;

    public ApplicationsController(IJobService jobService)
    {
        _jobService = jobService;
    }

    [HttpGet]
    public async Task<IActionResult> GetApplications(
        [FromQuery] string? status,
        CancellationToken ct = default)
    {
        try
        {
            var applications = await _jobService.GetStudentApplicationsAsync(CurrentUserId, status, ct);
            return Ok(applications);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
