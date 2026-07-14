using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class VerifyOtpRequestDto
{
    [Required]
    public string OtpToken { get; set; } = string.Empty;

    [Required]
    [StringLength(6, MinimumLength = 6)]
    [RegularExpression("^[0-9]{6}$", ErrorMessage = "Code must be a 6-digit number.")]
    public string Code { get; set; } = string.Empty;
}
