using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class UpdateCompanyProfileRequestDto
{
    [Required(ErrorMessage = "Company name is required.")]
    [StringLength(200, ErrorMessage = "Company name cannot exceed 200 characters.")]
    public string CompanyName { get; set; } = string.Empty;

    // Optional. When present it must parse as an absolute http/https URL — enforced in the service.
    [StringLength(2048, ErrorMessage = "Corporate website cannot exceed 2048 characters.")]
    public string? CorporateWebsite { get; set; }

    [StringLength(150, ErrorMessage = "Industry sector cannot exceed 150 characters.")]
    public string IndustrySector { get; set; } = string.Empty;
}
