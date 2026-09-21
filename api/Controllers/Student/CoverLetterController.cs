using InternLinkApi.DTOs;
using InternLinkApi.Services.CoverLetterService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

[Route("api/student/jobs/{jobId:guid}/cover-letter")]
public class CoverLetterController : StudentApiControllerBase
{
    private readonly ICoverLetterService _coverLetterService;

    public CoverLetterController(ICoverLetterService coverLetterService)
    {
        _coverLetterService = coverLetterService;
    }

    [HttpPost]
    public async Task<IActionResult> GenerateCoverLetter(Guid jobId, CancellationToken ct = default)
    {
        try
        {
            var result = await _coverLetterService.GenerateAsync(CurrentUserId, jobId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetSavedCoverLetter(Guid jobId, CancellationToken ct = default)
    {
        try
        {
            var result = await _coverLetterService.GetSavedAsync(CurrentUserId, jobId, ct);
            if (result is null)
            {
                return Ok(new { hasSaved = false, coverLetter = (CoverLetterDto?)null });
            }

            return Ok(new { hasSaved = true, coverLetter = result });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("save")]
    public async Task<IActionResult> SaveCoverLetter(
        Guid jobId,
        [FromBody] SaveCoverLetterRequestDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        try
        {
            var saved = await _coverLetterService.SaveAsync(CurrentUserId, jobId, dto.FinalText, ct);
            return Ok(saved);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("pdf")]
    public async Task<IActionResult> GenerateCoverLetterPdf(
        Guid jobId,
        [FromBody] GenerateCoverLetterPdfRequestDto? dto,
        CancellationToken ct = default)
    {
        try
        {
            var (pdfBytes, fileName) = await _coverLetterService.GeneratePdfBytesAsync(
                CurrentUserId, jobId, dto?.Text, ct);
            return File(pdfBytes, "application/pdf", fileName);
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
}
