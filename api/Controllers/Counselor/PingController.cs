using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Counselor;

public class PingController : CounselorApiControllerBase
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
