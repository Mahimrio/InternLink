using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Company;

[Authorize(Policy = "CompanyOnly")]
[Route("api/company/[controller]")]
[ApiController]
public abstract class CompanyApiControllerBase : ControllerBase
{
    protected Guid CurrentUserId =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
}
