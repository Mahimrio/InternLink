using System.Text.Json;
using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;
using InternLinkApi.Services.ResumeService;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Services.CoverLetterService;

public class CoverLetterService : ICoverLetterService
{
    private readonly IStudentRepository _studentRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IResumeRepository _resumeRepository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly ILlmClient _llmClient;
    private readonly ICoverLetterPdfService _pdfService;
    private readonly ISupabaseStorageService _storageService;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<CoverLetterService> _logger;

    public CoverLetterService(
        IStudentRepository studentRepository,
        IJobRepository jobRepository,
        IResumeRepository resumeRepository,
        IApplicationRepository applicationRepository,
        ILlmClient llmClient,
        ICoverLetterPdfService pdfService,
        ISupabaseStorageService storageService,
        ApplicationDbContext db,
        ILogger<CoverLetterService> logger)
    {
        _studentRepository = studentRepository;
        _jobRepository = jobRepository;
        _resumeRepository = resumeRepository;
        _applicationRepository = applicationRepository;
        _llmClient = llmClient;
        _pdfService = pdfService;
        _storageService = storageService;
        _db = db;
        _logger = logger;
    }

    public async Task<GenerateCoverLetterResponseDto> GenerateAsync(Guid userId, Guid jobId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var job = await _db.Jobs
            .Include(j => j.Company)
            .Include(j => j.JobSkills)
                .ThenInclude(js => js.Skill)
            .FirstOrDefaultAsync(j => j.Id == jobId, ct)
            ?? throw new KeyNotFoundException("Job posting not found.");

        // Retrieve most recently finalized resume
        var resumes = await _resumeRepository.GetByStudentIdAsync(student.Id, ct);
        var resume = resumes
            .Where(r => !string.IsNullOrWhiteSpace(r.DocumentPath))
            .OrderByDescending(r => r.LastModified)
            .FirstOrDefault() ?? resumes.OrderByDescending(r => r.LastModified).FirstOrDefault();

        var resumeSummary = ExtractResumeSummary(resume?.DynamicJsonData);

        var requiredSkills = job.JobSkills.Any()
            ? string.Join(", ", job.JobSkills.Select(js => $"{js.Skill?.SkillName ?? "Skill"} (weight: {js.RequiredImportanceWeight})"))
            : "General software development";

        var companyName = job.Company?.CompanyName
            ?? job.CompanyNameSnapshot
            ?? "the hiring organization";

        var systemPrompt =
            "You are an expert career counselor and professional cover letter writer for university students and early-career engineers.\n" +
            "Your task is to write a highly tailored, compelling, and specific cover letter for an internship application.\n" +
            "Output guidelines:\n" +
            "1. Length: 250 to 400 words.\n" +
            "2. Format: Output ONLY plain prose paragraphs separated by double newlines. Do NOT output any markdown headers (# or ##), do NOT include JSON wrapping, and do NOT include meta-commentary before or after.\n" +
            "3. Tone: Professional, enthusiastic, authentic, and confident. Avoid cliché filler phrases (like 'I am writing to express my eager excitement') and avoid sounding like a generic template.\n" +
            "4. Content: Explicitly connect the student's actual background, projects, academic studies, and skills to the employer's specific job description and selection criteria.";

        var userPrompt =
            $"Student Information:\n" +
            $"- Name: {student.FirstName} {student.LastName}\n" +
            $"- Department / Major: {student.Department}\n" +
            $"- CGPA: {student.CGPA:F2}\n" +
            $"- Interests: {student.Interests ?? "Technology, problem solving"}\n" +
            $"- Biography: {student.Biography ?? "Motivated university student seeking hands-on industry experience"}\n" +
            $"- Resume Highlights: {resumeSummary}\n\n" +
            $"Target Internship Posting:\n" +
            $"- Company: {companyName}\n" +
            $"- Role Title: {job.Title}\n" +
            $"- Location Type: {job.LocationType}\n" +
            $"- Required Skills & Weights: {requiredSkills}\n" +
            $"- Core Description: {job.CoreDescription}\n" +
            $"- Selection Criteria: {job.SelectionCriteria}\n\n" +
            $"Write a customized, persuasive cover letter matching this candidate to this specific internship.";

        try
        {
            var llmResponse = await _llmClient.CompletePromptAsync(
                systemPrompt,
                userPrompt,
                IntegrationFeature.CoverLetter,
                userId,
                ct);

            var letterText = CleanLlmText(llmResponse.Content);
            return new GenerateCoverLetterResponseDto(letterText);
        }
        catch (AiServiceException ex)
        {
            _logger.LogError(ex, "AI cover letter generation failed for student {StudentId}, job {JobId}", student.Id, jobId);
            // Graceful fallback draft if AI service is temporarily unavailable
            var fallback = GenerateFallbackCoverLetter(student, job, companyName);
            return new GenerateCoverLetterResponseDto(fallback);
        }
    }

    public async Task<CoverLetterDto> SaveAsync(Guid userId, Guid jobId, string finalText, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(finalText))
        {
            throw new ArgumentException("Cover letter text cannot be empty.", nameof(finalText));
        }

        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var job = await _jobRepository.GetByIdAsync(jobId, ct)
            ?? throw new KeyNotFoundException("Job posting not found.");

        var existingCoverLetter = await _db.CoverLetters
            .FirstOrDefaultAsync(cl => cl.StudentId == student.Id && cl.JobId == jobId, ct);

        if (existingCoverLetter is null)
        {
            existingCoverLetter = new CoverLetter
            {
                Id = Guid.NewGuid(),
                StudentId = student.Id,
                JobId = jobId,
                Content = finalText.Trim(),
                CreatedAt = DateTimeOffset.UtcNow,
                LastModified = DateTimeOffset.UtcNow
            };
            await _db.CoverLetters.AddAsync(existingCoverLetter, ct);
        }
        else
        {
            existingCoverLetter.Content = finalText.Trim();
            existingCoverLetter.LastModified = DateTimeOffset.UtcNow;
            _db.CoverLetters.Update(existingCoverLetter);
        }

        // Also update existing Application if one is already present
        var application = await _db.Applications
            .FirstOrDefaultAsync(a => a.StudentId == student.Id && a.JobId == jobId, ct);

        if (application is not null)
        {
            application.CoverLetterText = finalText.Trim();
            _db.Applications.Update(application);
        }

        await _db.SaveChangesAsync(ct);

        string? downloadUrl = null;
        if (!string.IsNullOrWhiteSpace(existingCoverLetter.DocumentPath))
        {
            try
            {
                downloadUrl = await _storageService.CreateSignedUrlAsync("resumes", existingCoverLetter.DocumentPath, 3600, ct);
            }
            catch
            {
                // Non-fatal
            }
        }

        return new CoverLetterDto(
            existingCoverLetter.Id,
            existingCoverLetter.JobId,
            existingCoverLetter.Content,
            existingCoverLetter.DocumentPath,
            downloadUrl,
            existingCoverLetter.LastModified);
    }

    public async Task<CoverLetterDto?> GetSavedAsync(Guid userId, Guid jobId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var coverLetter = await _db.CoverLetters
            .AsNoTracking()
            .FirstOrDefaultAsync(cl => cl.StudentId == student.Id && cl.JobId == jobId, ct);

        if (coverLetter is null)
        {
            // If no separate CoverLetter record, check if Application has CoverLetterText
            var app = await _db.Applications
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.StudentId == student.Id && a.JobId == jobId, ct);

            if (app is not null && !string.IsNullOrWhiteSpace(app.CoverLetterText))
            {
                return new CoverLetterDto(
                    Guid.Empty,
                    jobId,
                    app.CoverLetterText,
                    null,
                    null,
                    app.SubmittedAt);
            }

            return null;
        }

        string? downloadUrl = null;
        if (!string.IsNullOrWhiteSpace(coverLetter.DocumentPath))
        {
            try
            {
                downloadUrl = await _storageService.CreateSignedUrlAsync("resumes", coverLetter.DocumentPath, 3600, ct);
            }
            catch
            {
                // Non-fatal
            }
        }

        return new CoverLetterDto(
            coverLetter.Id,
            coverLetter.JobId,
            coverLetter.Content,
            coverLetter.DocumentPath,
            downloadUrl,
            coverLetter.LastModified);
    }

    public async Task<CoverLetterPdfResponseDto> GeneratePdfAsync(
        Guid userId,
        Guid jobId,
        string? customText = null,
        CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var job = await _jobRepository.GetByIdAsync(jobId, ct)
            ?? throw new KeyNotFoundException("Job posting not found.");

        string textToRender = customText?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(textToRender))
        {
            var saved = await _db.CoverLetters
                .FirstOrDefaultAsync(cl => cl.StudentId == student.Id && cl.JobId == jobId, ct);

            textToRender = saved?.Content ?? string.Empty;
        }

        if (string.IsNullOrWhiteSpace(textToRender))
        {
            throw new InvalidOperationException("No cover letter text available to generate PDF.");
        }

        var (storagePath, downloadUrl) = await _pdfService.RenderAndUploadPdfAsync(student, job, textToRender, ct);

        // Update DocumentPath on saved CoverLetter if exists
        var clRecord = await _db.CoverLetters
            .FirstOrDefaultAsync(cl => cl.StudentId == student.Id && cl.JobId == jobId, ct);

        if (clRecord is not null)
        {
            clRecord.DocumentPath = storagePath;
            clRecord.LastModified = DateTimeOffset.UtcNow;
            await _db.SaveChangesAsync(ct);
        }

        return new CoverLetterPdfResponseDto(downloadUrl, storagePath);
    }

    public async Task<(byte[] pdfBytes, string fileName)> GeneratePdfBytesAsync(
        Guid userId,
        Guid jobId,
        string? customText = null,
        CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var job = await _jobRepository.GetByIdAsync(jobId, ct)
            ?? throw new KeyNotFoundException("Job posting not found.");

        string textToRender = customText?.Trim() ?? string.Empty;

        if (string.IsNullOrWhiteSpace(textToRender))
        {
            var saved = await _db.CoverLetters
                .FirstOrDefaultAsync(cl => cl.StudentId == student.Id && cl.JobId == jobId, ct);

            textToRender = saved?.Content ?? string.Empty;
        }

        if (string.IsNullOrWhiteSpace(textToRender))
        {
            throw new InvalidOperationException("No cover letter text available to generate PDF.");
        }

        var pdfBytes = _pdfService.RenderPdfBytes(student, job, textToRender);
        var companySlug = (job.Company?.CompanyName ?? job.CompanyNameSnapshot ?? "Company")
            .Replace(" ", "_");
        var fileName = $"CoverLetter_{student.FirstName}_{student.LastName}_{companySlug}.pdf";

        return (pdfBytes, fileName);
    }

    private static string CleanLlmText(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;

        var text = raw.Trim();
        // Remove markdown backticks fences if model wrapped response in ```
        if (text.StartsWith("```", StringComparison.Ordinal))
        {
            var firstLineBreak = text.IndexOf('\n');
            if (firstLineBreak != -1)
            {
                text = text.Substring(firstLineBreak + 1);
            }
            if (text.EndsWith("```", StringComparison.Ordinal))
            {
                text = text.Substring(0, text.Length - 3).Trim();
            }
        }

        return text.Trim();
    }

    private static string ExtractResumeSummary(string? dynamicJsonData)
    {
        if (string.IsNullOrWhiteSpace(dynamicJsonData)) return "None provided";

        try
        {
            using var doc = JsonDocument.Parse(dynamicJsonData);
            var root = doc.RootElement;
            var parts = new List<string>();

            if (root.TryGetProperty("personal-info", out var pInfo) && pInfo.TryGetProperty("summary", out var sProp))
            {
                var sum = sProp.GetString();
                if (!string.IsNullOrWhiteSpace(sum)) parts.Add($"Summary: {sum}");
            }

            if (root.TryGetProperty("skills", out var skillsProp) && skillsProp.ValueKind == JsonValueKind.Array)
            {
                var skills = new List<string>();
                foreach (var sk in skillsProp.EnumerateArray())
                {
                    if (sk.ValueKind == JsonValueKind.String) skills.Add(sk.GetString() ?? "");
                    else if (sk.ValueKind == JsonValueKind.Object && (sk.TryGetProperty("skillName", out var n) || sk.TryGetProperty("name", out n)))
                    {
                        skills.Add(n.GetString() ?? "");
                    }
                }
                if (skills.Count > 0) parts.Add($"Skills: {string.Join(", ", skills)}");
            }

            if (root.TryGetProperty("experience", out var expProp))
            {
                parts.Add($"Experience: {expProp}");
            }

            return parts.Count > 0 ? string.Join("; ", parts) : "Standard curriculum coursework";
        }
        catch
        {
            return "Curriculum coursework and academic projects";
        }
    }

    private static string GenerateFallbackCoverLetter(Student student, Job job, string companyName)
    {
        return $"Dear Hiring Team at {companyName},\n\n" +
               $"I am writing to express my strong enthusiasm for the {job.Title} internship position at {companyName}. " +
               $"As a dedicated student in the {student.Department} department with an academic track record of {student.CGPA:F2} CGPA, " +
               $"I have developed a strong foundation in modern software development and engineering best practices.\n\n" +
               $"Reviewing the core responsibilities for this role, I was particularly drawn to your focus on {job.Title}. " +
               $"{student.Biography ?? "Throughout my academic and project work, I have consistently tackled challenging technical problems and collaborated effectively with peers."} " +
               $"I am eager to apply my analytical capabilities and technical skills to support {companyName}'s engineering objectives while expanding my practical industry knowledge.\n\n" +
               $"Thank you for considering my application. I welcome the opportunity to discuss how my enthusiasm and skill set align with your team's upcoming goals.\n\n" +
               $"Sincerely,\n{student.FirstName} {student.LastName}";
    }
}
