using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class CreateJobRequestDto
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Core description is required.")]
    [StringLength(5000, ErrorMessage = "Core description cannot exceed 5000 characters.")]
    public string CoreDescription { get; set; } = string.Empty;

    [StringLength(2000, ErrorMessage = "Selection criteria cannot exceed 2000 characters.")]
    public string SelectionCriteria { get; set; } = string.Empty;

    // Parsed to the LocationType enum in the service so an invalid value yields a field-level 400.
    [Required(ErrorMessage = "Location type is required.")]
    public string LocationType { get; set; } = string.Empty;

    // Future-date rule is enforced server-side in the service, not just here.
    [Required(ErrorMessage = "Deadline is required.")]
    public DateTimeOffset DeadLine { get; set; }

    public List<JobSkillRequestDto> RequiredSkills { get; set; } = [];
}

public class JobSkillRequestDto
{
    [Required(ErrorMessage = "skillId is required.")]
    public Guid SkillId { get; set; }

    [Range(1, 5, ErrorMessage = "weight must be between 1 and 5.")]
    public int Weight { get; set; }
}
