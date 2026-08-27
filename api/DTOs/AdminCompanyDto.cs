namespace InternLinkApi.DTOs;

public class AdminCompanyDto
{
    public Guid Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string? CorporateWebsite { get; set; }
    public string IndustrySector { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public string ContactEmail { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
