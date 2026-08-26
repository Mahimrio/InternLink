using InternLinkApi.Services.AdminService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Admin;

public class UsersController : AdminApiControllerBase
{
    private readonly IAdminUserService _userService;

    public UsersController(IAdminUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? role,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var result = await _userService.GetUsersAsync(role, search, page, pageSize, ct);
        return Ok(result);
    }

    [HttpPost("{id:guid}/suspend")]
    public async Task<IActionResult> Suspend(Guid id, CancellationToken ct = default)
    {
        try
        {
            await _userService.SuspendAsync(CurrentUserId, id, ct);
            return Ok(new { message = "User suspended." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/reactivate")]
    public async Task<IActionResult> Reactivate(Guid id, CancellationToken ct = default)
    {
        try
        {
            await _userService.ReactivateAsync(CurrentUserId, id, ct);
            return Ok(new { message = "User reactivated." });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
