using System.ComponentModel.DataAnnotations;

namespace InternLinkApi.DTOs;

public record GenerateCoverLetterResponseDto(
    string GeneratedText
);

public class SaveCoverLetterRequestDto
{
    [Required(ErrorMessage = "Cover letter text is required.")]
    public string FinalText { get; set; } = string.Empty;
}

public class GenerateCoverLetterPdfRequestDto
{
    [Required(ErrorMessage = "Cover letter text is required.")]
    public string Text { get; set; } = string.Empty;
}

public record CoverLetterDto(
    Guid Id,
    Guid JobId,
    string Content,
    string? DocumentPath,
    string? DownloadUrl,
    DateTimeOffset LastModified
);

public record CoverLetterPdfResponseDto(
    string DownloadUrl,
    string DocumentPath
);
