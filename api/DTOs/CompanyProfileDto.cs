namespace InternLinkApi.DTOs;

// Company onboarding profile. VerificationStatus is read-only/informational here —
// it is only ever changed by the Admin verification endpoints (Prompt 26).
public class CompanyProfileDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string? CorporateWebsite { get; set; }
    public string IndustrySector { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
}
