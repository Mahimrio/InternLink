using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class Company
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CorporateWebsite { get; set; }
    public string IndustrySector { get; set; } = string.Empty;
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;

    public User User { get; set; } = null!;
    public ICollection<Job> Jobs { get; set; } = [];
}
