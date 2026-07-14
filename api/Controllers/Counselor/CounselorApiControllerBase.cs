using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Counselor;

[Authorize(Policy = "CounselorOnly")]
[Route("api/counselor/[controller]")]
[ApiController]
public abstract class CounselorApiControllerBase : ControllerBase
{
    protected Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
