using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class ResendOtpRequestDto
{
    [Required]
    public string OtpToken { get; set; } = string.Empty;
}
