using InternLinkApi.Models;
using InternLinkApi.Services.ResumeService;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InternLinkApi.Services.CoverLetterService;

public class CoverLetterPdfService : ICoverLetterPdfService
{
    private readonly ISupabaseStorageService _storageService;
    private readonly ILogger<CoverLetterPdfService> _logger;

    public CoverLetterPdfService(
        ISupabaseStorageService storageService,
        ILogger<CoverLetterPdfService> logger)
    {
        _storageService = storageService;
        _logger = logger;
    }

    public async Task<(string storagePath, string downloadUrl)> RenderAndUploadPdfAsync(
        Student student,
        Job job,
        string coverLetterText,
        CancellationToken ct = default)
    {
        var pdfBytes = GeneratePdfInMemory(student, job, coverLetterText);
        var fileName = $"{student.Id}/{job.Id}.pdf";
        var storagePath = $"cover-letters/{fileName}";

        try
        {
            await _storageService.UploadFileAsync("resumes", storagePath, pdfBytes, "application/pdf", ct);
            var downloadUrl = await _storageService.CreateSignedUrlAsync("resumes", storagePath, 3600, ct);
            return (storagePath, downloadUrl);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to upload cover letter PDF to Supabase Storage. Returning in-memory data URI fallback.");
            // If storage is unavailable or bucket not yet configured, provide data URL fallback
            var base64 = Convert.ToBase64String(pdfBytes);
            var dataUrl = $"data:application/pdf;base64,{base64}";
            return (storagePath, dataUrl);
        }
    }

    public byte[] RenderPdfBytes(Student student, Job job, string coverLetterText)
    {
        return GeneratePdfInMemory(student, job, coverLetterText);
    }

    private static byte[] GeneratePdfInMemory(Student student, Job job, string coverLetterText)
    {
        using var stream = new MemoryStream();

        var companyName = job.Company?.CompanyName
            ?? job.CompanyNameSnapshot
            ?? "Hiring Committee";

        var studentEmail = student.User?.Email ?? string.Empty;
        var studentPhone = student.User?.PhoneNumber ?? string.Empty;

        var paragraphs = coverLetterText
            .Replace("\r\n", "\n")
            .Split(new[] { "\n\n", "\n" }, StringSplitOptions.RemoveEmptyEntries)
            .Select(p => p.Trim())
            .Where(p => !string.IsNullOrWhiteSpace(p))
            .ToList();

        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Inter").LineHeight(1.4f));

                page.Header()
                    .Column(col =>
                    {
                        col.Item().Row(row =>
                        {
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text($"{student.FirstName} {student.LastName}")
                                    .Bold()
                                    .FontSize(20)
                                    .FontColor(Colors.Teal.Darken3);

                                var contactLine = $"{student.Department} • ID: {student.InstitutionalId}";
                                if (!string.IsNullOrWhiteSpace(studentEmail))
                                {
                                    contactLine += $" • {studentEmail}";
                                }
                                if (!string.IsNullOrWhiteSpace(studentPhone))
                                {
                                    contactLine += $" • {studentPhone}";
                                }

                                c.Item().Text(contactLine)
                                    .FontSize(9.5f)
                                    .FontColor(Colors.Grey.Darken2);
                            });
                        });

                        col.Item().PaddingTop(8).LineHorizontal(1.5f).LineColor(Colors.Teal.Medium);
                    });

                page.Content()
                    .PaddingVertical(14)
                    .Column(col =>
                    {
                        // Date
                        col.Item().PaddingBottom(12).Text(DateTime.UtcNow.ToString("MMMM dd, yyyy"))
                            .FontSize(10)
                            .FontColor(Colors.Grey.Darken2);

                        // Recipient info
                        col.Item().PaddingBottom(12).Column(r =>
                        {
                            r.Item().Text("To:").FontSize(10).FontColor(Colors.Grey.Darken1);
                            r.Item().Text($"Hiring Team at {companyName}").Bold().FontSize(11).FontColor(Colors.Grey.Darken3);
                            r.Item().Text($"Re: Application for {job.Title}").Italic().FontSize(10.5f).FontColor(Colors.Teal.Darken2);
                        });

                        // Cover letter paragraphs
                        foreach (var paragraph in paragraphs)
                        {
                            col.Item().PaddingBottom(10).Text(paragraph).FontSize(10.5f).FontColor(Colors.Grey.Darken4);
                        }

                        // Closing
                        col.Item().PaddingTop(12).Column(closing =>
                        {
                            closing.Item().Text("Sincerely,").FontSize(10.5f);
                            closing.Item().PaddingTop(24).Text($"{student.FirstName} {student.LastName}")
                                .Bold()
                                .FontSize(11)
                                .FontColor(Colors.Teal.Darken3);
                            closing.Item().Text($"Student ID: {student.InstitutionalId} • {student.Department}")
                                .FontSize(9.5f)
                                .FontColor(Colors.Grey.Darken2);
                        });
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Generated by InternLink Career Portal • Document verified");
                    });
            });
        }).GeneratePdf(stream);

        return stream.ToArray();
    }
}
