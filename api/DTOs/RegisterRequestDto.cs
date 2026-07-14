using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class RegisterRequestDto
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    [RegularExpression(@"^(?=.*\d)(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{8,}$",
        ErrorMessage = "Password must be at least 8 characters, include an uppercase letter, a digit, and a non-alphanumeric character.")]
    public string Password { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^(Student|Company)$", ErrorMessage = "Role must be 'Student' or 'Company'.")]
    public string Role { get; set; } = string.Empty;

    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? CompanyName { get; set; }
}
