using InternLinkApi.Models;

namespace InternLinkApi.Services.CoverLetterService;

public interface ICoverLetterPdfService
{
    Task<(string storagePath, string downloadUrl)> RenderAndUploadPdfAsync(
        Student student,
        Job job,
        string coverLetterText,
        CancellationToken ct = default);

    byte[] RenderPdfBytes(
        Student student,
        Job job,
        string coverLetterText);
}
