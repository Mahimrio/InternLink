using InternLinkApi.DTOs;
using InternLinkApi.Exceptions;
using InternLinkApi.Services.CompanyProfileService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Company;

public class ProfileController : CompanyApiControllerBase
{
    private readonly ICompanyProfileService _profileService;

    public ProfileController(ICompanyProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var profile = await _profileService.GetProfileAsync(CurrentUserId, ct);
        if (profile is null)
        {
            return NotFound(new { error = "Company profile not found." });
        }

        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCompanyProfileRequestDto dto, CancellationToken ct)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(new { error = "Validation failed.", details = ModelState });
        }

        try
        {
            var updated = await _profileService.UpdateProfileAsync(CurrentUserId, dto, ct);
            return Ok(updated);
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
