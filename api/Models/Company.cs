using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class Company
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CorporateWebsite { get; set; }
    public string IndustrySector { get; set; } = string.Empty;

    // INVARIANT: VerificationStatus starts Pending at registration (Prompt 9) and is ONLY ever
    // changed by the Admin verification endpoints (Prompt 26). No company-facing endpoint
    // (profile update, job posting, etc.) may set this — it is not settable by the company.
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;

    public User User { get; set; } = null!;
    public ICollection<Job> Jobs { get; set; } = [];
}
