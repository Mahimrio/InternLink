using InternLinkApi.DTOs;
using InternLinkApi.Services.AssessmentService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

public class AssessmentsController : StudentApiControllerBase
{
    private readonly IAssessmentService _assessmentService;

    public AssessmentsController(IAssessmentService assessmentService)
    {
        _assessmentService = assessmentService;
    }

    [HttpGet("skills")]
    public async Task<IActionResult> GetAvailableSkills(CancellationToken ct)
    {
        try
        {
            var skills = await _assessmentService.GetAvailableSkillsAsync(CurrentUserId, ct);
            return Ok(skills);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("{skillId:guid}/start")]
    public async Task<IActionResult> StartAssessment([FromRoute] Guid skillId, CancellationToken ct)
    {
        try
        {
            var response = await _assessmentService.StartAssessmentAsync(CurrentUserId, skillId, ct);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("submit")]
    public async Task<IActionResult> SubmitAssessment([FromBody] SubmitAssessmentRequestDto request, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Invalid assessment submission.", details = ModelState });
        }

        try
        {
            var result = await _assessmentService.SubmitAssessmentAsync(CurrentUserId, request, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("verified")]
    public async Task<IActionResult> GetVerifiedSkills(CancellationToken ct)
    {
        try
        {
            var verified = await _assessmentService.GetVerifiedSkillsAsync(CurrentUserId, ct);
            return Ok(verified);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
