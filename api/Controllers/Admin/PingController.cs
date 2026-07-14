using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Admin;

public class PingController : AdminApiControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            role = User.FindFirstValue(ClaimTypes.Role),
            userId = CurrentUserId.ToString(),
        });
    }
}
