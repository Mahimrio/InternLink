using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Company;

public class PingController : CompanyApiControllerBase
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
