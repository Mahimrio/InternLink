using InternLinkApi.DTOs;
using InternLinkApi.Exceptions;
using InternLinkApi.Services.AtsService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Company;

public class AtsController : CompanyApiControllerBase
{
    private readonly IAtsService _atsService;

    public AtsController(IAtsService atsService)
    {
        _atsService = atsService;
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications(
        [FromQuery] Guid? jobId,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _atsService.GetApplicationsAsync(CurrentUserId, jobId, status, page, pageSize, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpGet("applications/{id:guid}")]
    public async Task<IActionResult> GetApplicationDetail(Guid id, CancellationToken ct = default)
    {
        try
        {
            var detail = await _atsService.GetApplicationDetailAsync(CurrentUserId, id, ct);
            if (detail is null)
            {
                return NotFound(new { error = "Application not found." });
            }

            return Ok(detail);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPut("applications/{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(
        Guid id,
        [FromBody] UpdateApplicationStatusRequestDto dto,
        CancellationToken ct = default)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        try
        {
            var updated = await _atsService.UpdateStatusAsync(CurrentUserId, id, dto, ct);
            return Ok(updated);
        }
        catch (InvalidStatusTransitionException)
        {
            return BadRequest(new { error = "Invalid status transition" });
        }
        catch (ValidationFailedException ex)
        {
            return BadRequest(new { error = ex.Message, details = ex.Errors });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
