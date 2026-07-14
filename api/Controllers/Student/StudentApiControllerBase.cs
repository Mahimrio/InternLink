using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

[Authorize(Policy = "StudentOnly")]
[Route("api/student/[controller]")]
[ApiController]
public abstract class StudentApiControllerBase : ControllerBase
{
    protected Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
