using Microsoft.AspNetCore.Identity;

namespace InternLinkApi.Models;

public class Role : IdentityRole<Guid>
{
    public ICollection<User> Users { get; set; } = [];
}
