using InternLinkApi.Services.CounselorAdvisingService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

[Route("api/student/advising-notes")]
public class AdvisingNotesController : StudentApiControllerBase
{
    private readonly ICounselorAdvisingService _advisingService;

    public AdvisingNotesController(ICounselorAdvisingService advisingService)
    {
        _advisingService = advisingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAdvisingNotes(CancellationToken ct)
    {
        var notes = await _advisingService.GetStudentOwnFeedbackAsync(CurrentUserId, ct);
        return Ok(notes);
    }
}
