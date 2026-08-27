using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class ApplyJobRequestDto
{
    [Required(ErrorMessage = "ResumeId is required.")]
    public Guid ResumeId { get; set; }
}
