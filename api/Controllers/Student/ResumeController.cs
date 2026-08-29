using System.Text.Json;
using InternLinkApi.DTOs;
using InternLinkApi.Services.ResumeAnalysisService;
using InternLinkApi.Services.ResumeService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

[Route("api/student/resumes")]
public class ResumeController : StudentApiControllerBase
{
    private readonly IResumeService _resumeService;
    private readonly IResumeAnalysisService _analysisService;

    public ResumeController(IResumeService resumeService, IResumeAnalysisService analysisService)
    {
        _resumeService = resumeService;
        _analysisService = analysisService;
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

    [HttpPost("{id:guid}/analyze")]
    public async Task<IActionResult> AnalyzeResume(Guid id, [FromQuery] Guid? targetJobId, CancellationToken ct)
    {
        try
        {
            var score = await _analysisService.GetAtsScoreAsync(CurrentUserId, id, ct);

            List<ResumeSuggestionDto>? suggestions = null;
            if (targetJobId.HasValue)
            {
                suggestions = await _analysisService.GetImprovementSuggestionsAsync(CurrentUserId, id, targetJobId.Value, ct);
            }

            return Ok(new ResumeAnalysisResponseDto(score, suggestions));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
