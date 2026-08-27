using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class UpdateProfileRequestDto
{
    [Required(ErrorMessage = "First name is required.")]
    [StringLength(100, ErrorMessage = "First name cannot exceed 100 characters.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required.")]
    [StringLength(100, ErrorMessage = "Last name cannot exceed 100 characters.")]
    public string LastName { get; set; } = string.Empty;

    [Range(0.00, 4.00, ErrorMessage = "CGPA must be between 0.00 and 4.00.")]
    public decimal CGPA { get; set; }

    [StringLength(150, ErrorMessage = "Department cannot exceed 150 characters.")]
    public string Department { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Biography cannot exceed 2000 characters.")]
    public string? Biography { get; set; }

    [StringLength(1000, ErrorMessage = "Interests cannot exceed 1000 characters.")]
    public string? Interests { get; set; }

    /// <summary>
    /// If client attempts to change institutionalId post-registration, backend will reject it with 400.
    /// </summary>
    public string? InstitutionalId { get; set; }
}
