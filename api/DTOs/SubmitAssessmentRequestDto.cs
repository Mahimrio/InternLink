using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public class StudentAnswerDto
{
    [Required]
    public string QuestionId { get; set; } = string.Empty;

    [Range(-1, 3)]
    public int SelectedOptionIndex { get; set; } = -1;
}

public class SubmitAssessmentRequestDto
{
    [Required]
    public string SessionToken { get; set; } = string.Empty;

    public List<StudentAnswerDto> Answers { get; set; } = [];
}
