using System.Text.Json;
using InternLinkApi.DTOs;
using InternLinkApi.Services.ResumeService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

[Route("api/student/resumes")]
public class ResumeController : StudentApiControllerBase
{
    private readonly IResumeService _resumeService;

    public ResumeController(IResumeService resumeService)
    {
        _resumeService = resumeService;
    }

    [HttpPost]
    public async Task<IActionResult> CreateResume(CancellationToken ct)
    {
        try
        {
            var result = await _resumeService.CreateResumeAsync(CurrentUserId, ct);
            return StatusCode(201, result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("{id:guid}/step/{stepName}")]
    public async Task<IActionResult> UpdateStep(
        Guid id,
        string stepName,
        [FromBody] JsonElement stepData,
        CancellationToken ct)
    {
        try
        {
            var updated = await _resumeService.UpdateResumeStepAsync(CurrentUserId, id, stepName, stepData, ct);
            return Ok(updated);
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

    [HttpPost("{id:guid}/finalize")]
    public async Task<IActionResult> FinalizeResume(Guid id, CancellationToken ct)
    {
        try
        {
            var result = await _resumeService.FinalizeResumeAsync(CurrentUserId, id, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetResumes(CancellationToken ct)
    {
        try
        {
            var list = await _resumeService.GetResumesAsync(CurrentUserId, ct);
            return Ok(list);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
