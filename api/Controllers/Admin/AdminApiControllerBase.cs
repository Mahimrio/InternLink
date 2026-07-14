using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Admin;

[Authorize(Policy = "AdminOnly")]
[Route("api/admin/[controller]")]
[ApiController]
public abstract class AdminApiControllerBase : ControllerBase
{
    protected Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
