using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

public class PingController : StudentApiControllerBase
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
