using Microsoft.AspNetCore.Identity;

namespace InternLinkApi.Models;

public class User : IdentityUser<Guid>
{
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;

    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public Student? Student { get; set; }
    public Company? Company { get; set; }
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<AIHistory> AIHistories { get; set; } = [];
    public ICollection<CounselorFeedback> CounselorFeedbacks { get; set; } = [];
}
