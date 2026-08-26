using InternLinkApi.DTOs;
using InternLinkApi.Services.ProfileService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

public class ProfileController : StudentApiControllerBase
{
    private readonly IProfileService _profileService;

    public ProfileController(IProfileService profileService)
    {
        _profileService = profileService;
    }

    [HttpGet]
    public async Task<IActionResult> GetProfile(CancellationToken ct)
    {
        var profile = await _profileService.GetProfileAsync(CurrentUserId, ct);
        if (profile is null)
        {
            return NotFound(new { error = "Student profile not found." });
        }

        return Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDto dto, CancellationToken ct)
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
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
