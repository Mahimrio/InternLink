using InternLinkApi.Services.CompanyJobService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Company;

public class SkillsController : CompanyApiControllerBase
{
    private readonly ICompanyJobService _jobService;

    public SkillsController(ICompanyJobService jobService)
    {
        _jobService = jobService;
    }

    // Read-only reference list for the job form. Allowed for any authenticated company
    // (including Pending) so the form can render even before verification.
    [HttpGet]
    public async Task<IActionResult> GetSkills(CancellationToken ct)
    {
        var skills = await _jobService.GetSkillOptionsAsync(ct);
        return Ok(skills);
    }
}
