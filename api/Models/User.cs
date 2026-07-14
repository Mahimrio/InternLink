namespace InternLinkApi.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsActive { get; set; } = true;

    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public Student? Student { get; set; }
    public Company? Company { get; set; }
    public ICollection<Notification> Notifications { get; set; } = [];
    public ICollection<AIHistory> AIHistories { get; set; } = [];
}
