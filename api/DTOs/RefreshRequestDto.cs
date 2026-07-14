using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class RefreshRequestDto
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}
