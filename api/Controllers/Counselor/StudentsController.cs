using InternLinkApi.DTOs;
using InternLinkApi.Services.CounselorAdvisingService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Counselor;

public class StudentsController : CounselorApiControllerBase
{
    private readonly ICounselorAdvisingService _advisingService;

    public StudentsController(ICounselorAdvisingService advisingService)
    {
        _advisingService = advisingService;
    }

    [HttpGet]
    public async Task<IActionResult> GetStudents([FromQuery] string? search, CancellationToken ct)
    {
        var students = await _advisingService.GetStudentsAsync(search, ct);
        return Ok(students);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetStudentDetail(Guid id, CancellationToken ct)
    {
        var studentDetail = await _advisingService.GetStudentDetailAsync(id, ct);
        if (studentDetail is null)
        {
            return NotFound(new { error = "Student not found." });
        }

        return Ok(studentDetail);
    }

    [HttpPost("{id:guid}/feedback")]
    public async Task<IActionResult> CreateFeedback(
        Guid id,
        [FromBody] CreateCounselorFeedbackRequestDto dto,
        CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        try
        {
            var created = await _advisingService.CreateFeedbackAsync(CurrentUserId, id, dto, ct);
            return StatusCode(201, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("{id:guid}/feedback")]
    public async Task<IActionResult> GetFeedback(Guid id, CancellationToken ct)
    {
        try
        {
            var history = await _advisingService.GetStudentFeedbackHistoryAsync(id, ct);
            return Ok(history);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
