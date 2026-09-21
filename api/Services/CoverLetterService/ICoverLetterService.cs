using InternLinkApi.DTOs;

namespace InternLinkApi.Services.CoverLetterService;

public interface ICoverLetterService
{
    Task<GenerateCoverLetterResponseDto> GenerateAsync(Guid userId, Guid jobId, CancellationToken ct = default);
    Task<CoverLetterDto> SaveAsync(Guid userId, Guid jobId, string finalText, CancellationToken ct = default);
    Task<CoverLetterDto?> GetSavedAsync(Guid userId, Guid jobId, CancellationToken ct = default);
    Task<CoverLetterPdfResponseDto> GeneratePdfAsync(Guid userId, Guid jobId, string? customText = null, CancellationToken ct = default);
    Task<(byte[] pdfBytes, string fileName)> GeneratePdfBytesAsync(Guid userId, Guid jobId, string? customText = null, CancellationToken ct = default);
}
