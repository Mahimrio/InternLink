using System.Text.Json;
using System.Text.Json.Nodes;
using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace InternLinkApi.Services.ResumeService;

public class ResumeService : IResumeService
{
    private static readonly HashSet<string> AllowedSteps = new(StringComparer.OrdinalIgnoreCase)
    {
        "personal-info",
        "education",
        "experience",
        "skills"
    };

    private readonly IStudentRepository _studentRepository;
    private readonly IResumeRepository _resumeRepository;
    private readonly ISupabaseStorageService _storageService;
    private readonly ApplicationDbContext _db;

    public ResumeService(
        IStudentRepository studentRepository,
        IResumeRepository resumeRepository,
        ISupabaseStorageService storageService,
        ApplicationDbContext db)
    {
        _studentRepository = studentRepository;
        _resumeRepository = resumeRepository;
        _storageService = storageService;
        _db = db;
    }

    public async Task<CreateResumeResponseDto> CreateResumeAsync(Guid userId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var resume = new Resume
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            DynamicJsonData = "{}",
            LastModified = DateTimeOffset.UtcNow,
            DocumentPath = string.Empty
        };

        await _resumeRepository.AddAsync(resume, ct);
        await _resumeRepository.SaveChangesAsync(ct);

        return new CreateResumeResponseDto(resume.Id);
    }

    public async Task<ResumeDto> UpdateResumeStepAsync(
        Guid userId,
        Guid resumeId,
        string stepName,
        JsonElement stepData,
        CancellationToken ct = default)
    {
        var normalizedStep = stepName.ToLowerInvariant();
        if (!AllowedSteps.Contains(normalizedStep))
        {
            throw new ArgumentException($"Invalid step name '{stepName}'. Must be one of: personal-info, education, experience, skills.");
        }

        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var resume = await _resumeRepository.GetByIdAndStudentIdAsync(resumeId, student.Id, ct)
            ?? throw new KeyNotFoundException("Resume not found.");

        // Parse existing JSON data into JsonNode
        JsonObject rootObj;
        try
        {
            rootObj = JsonNode.Parse(string.IsNullOrWhiteSpace(resume.DynamicJsonData) ? "{}" : resume.DynamicJsonData)?.AsObject()
                ?? new JsonObject();
        }
        catch
        {
            rootObj = new JsonObject();
        }

        // Merge the current step's JSON node
        var stepNode = JsonNode.Parse(stepData.GetRawText());
        rootObj[normalizedStep] = stepNode;

        resume.DynamicJsonData = rootObj.ToJsonString();
        resume.LastModified = DateTimeOffset.UtcNow;

        // If step is skills, synchronize relational StudentSkills table
        if (normalizedStep == "skills")
        {
            await SyncStudentSkillsAsync(student.Id, stepData, ct);
        }

        await _resumeRepository.UpdateAsync(resume, ct);
        await _resumeRepository.SaveChangesAsync(ct);

        string? downloadUrl = null;
        if (!string.IsNullOrWhiteSpace(resume.DocumentPath))
        {
            downloadUrl = await _storageService.CreateSignedUrlAsync("resumes", resume.DocumentPath, 3600, ct);
        }

        return new ResumeDto(resume.Id, resume.LastModified, downloadUrl, resume.DynamicJsonData);
    }

    public async Task<FinalizeResumeResponseDto> FinalizeResumeAsync(Guid userId, Guid resumeId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var resume = await _resumeRepository.GetByIdAndStudentIdAsync(resumeId, student.Id, ct)
            ?? throw new KeyNotFoundException("Resume not found.");

        // Generate PDF in memory
        byte[] pdfBytes = GeneratePdfInMemory(student, resume.DynamicJsonData);

        var storagePath = $"resumes/{student.Id}/{resume.Id}.pdf";

        // Stream PDF bytes directly to Supabase Storage
        await _storageService.UploadFileAsync("resumes", $"{student.Id}/{resume.Id}.pdf", pdfBytes, "application/pdf", ct);

        resume.DocumentPath = storagePath;
        resume.LastModified = DateTimeOffset.UtcNow;

        await _resumeRepository.UpdateAsync(resume, ct);
        await _resumeRepository.SaveChangesAsync(ct);

        var downloadUrl = await _storageService.CreateSignedUrlAsync("resumes", storagePath, 3600, ct);

        return new FinalizeResumeResponseDto(storagePath, downloadUrl);
    }

    public async Task<IReadOnlyList<ResumeDto>> GetResumesAsync(Guid userId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var resumes = await _resumeRepository.GetByStudentIdAsync(student.Id, ct);
        var results = new List<ResumeDto>(resumes.Count);

        foreach (var r in resumes)
        {
            string? downloadUrl = null;
            if (!string.IsNullOrWhiteSpace(r.DocumentPath))
            {
                downloadUrl = await _storageService.CreateSignedUrlAsync("resumes", r.DocumentPath, 3600, ct);
            }
            results.Add(new ResumeDto(r.Id, r.LastModified, downloadUrl, r.DynamicJsonData));
        }

        return results;
    }

    private async Task SyncStudentSkillsAsync(Guid studentId, JsonElement stepData, CancellationToken ct)
    {
        try
        {
            var skillsToSync = new List<(string Name, int Level)>();

            if (stepData.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in stepData.EnumerateArray())
                {
                    if (item.ValueKind == JsonValueKind.String)
                    {
                        var name = item.GetString()?.Trim();
                        if (!string.IsNullOrEmpty(name)) skillsToSync.Add((name, 3));
                    }
                    else if (item.ValueKind == JsonValueKind.Object)
                    {
                        string? name = null;
                        int level = 3;

                        if (item.TryGetProperty("name", out var nameProp) || item.TryGetProperty("skillName", out nameProp))
                            name = nameProp.GetString()?.Trim();

                        if (item.TryGetProperty("proficiency", out var profProp) || item.TryGetProperty("level", out profProp))
                        {
                            if (profProp.ValueKind == JsonValueKind.Number) level = profProp.GetInt32();
                            else if (int.TryParse(profProp.GetString(), out var parsed)) level = parsed;
                        }

                        if (!string.IsNullOrEmpty(name)) skillsToSync.Add((name, Math.Clamp(level, 1, 5)));
                    }
                }
            }
            else if (stepData.ValueKind == JsonValueKind.Object)
            {
                if (stepData.TryGetProperty("skills", out var nestedArray) && nestedArray.ValueKind == JsonValueKind.Array)
                {
                    await SyncStudentSkillsAsync(studentId, nestedArray, ct);
                    return;
                }
            }

            if (skillsToSync.Count == 0) return;

            var existingStudentSkills = await _db.StudentSkills
                .Include(ss => ss.Skill)
                .Where(ss => ss.StudentId == studentId)
                .ToListAsync(ct);

            var allSkills = await _db.Skills.ToDictionaryAsync(s => s.SkillName.ToLowerInvariant(), ct);

            foreach (var (skillName, level) in skillsToSync)
            {
                var lower = skillName.ToLowerInvariant();
                if (!allSkills.TryGetValue(lower, out var skill))
                {
                    skill = new Skill
                    {
                        SkillName = skillName,
                        DomainClassification = DomainClassification.Backend
                    };
                    _db.Skills.Add(skill);
                    await _db.SaveChangesAsync(ct);
                    allSkills[lower] = skill;
                }

                var existing = existingStudentSkills.FirstOrDefault(ss => ss.SkillId == skill.Id);
                if (existing is not null)
                {
                    existing.ProficiencyLevel = level;
                    _db.StudentSkills.Update(existing);
                }
                else
                {
                    _db.StudentSkills.Add(new StudentSkill
                    {
                        StudentId = studentId,
                        SkillId = skill.Id,
                        ProficiencyLevel = level
                    });
                }
            }

            await _db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            // Log but don't fail entire resume step update if skills extraction is partial
            Console.Error.WriteLine($"WARN: Failed to sync relational student skills: {ex.Message}");
        }
    }

    private static byte[] GeneratePdfInMemory(Student student, string jsonData)
    {
        using var stream = new MemoryStream();

        string summary = string.Empty;
        string educationText = string.Empty;
        string experienceText = string.Empty;
        var skillsList = new List<string>();

        try
        {
            using var doc = JsonDocument.Parse(string.IsNullOrWhiteSpace(jsonData) ? "{}" : jsonData);
            var root = doc.RootElement;

            if (root.TryGetProperty("personal-info", out var pInfo))
            {
                if (pInfo.TryGetProperty("summary", out var sumProp)) summary = sumProp.GetString() ?? "";
            }
            if (root.TryGetProperty("education", out var edu))
            {
                educationText = edu.ToString();
            }
            if (root.TryGetProperty("experience", out var exp))
            {
                experienceText = exp.ToString();
            }
            if (root.TryGetProperty("skills", out var skl))
            {
                if (skl.ValueKind == JsonValueKind.Array)
                {
                    foreach (var s in skl.EnumerateArray())
                    {
                        if (s.ValueKind == JsonValueKind.String) skillsList.Add(s.GetString() ?? "");
                        else if (s.ValueKind == JsonValueKind.Object && (s.TryGetProperty("name", out var np) || s.TryGetProperty("skillName", out np)))
                        {
                            skillsList.Add(np.GetString() ?? "");
                        }
                    }
                }
            }
        }
        catch
        {
            // Fallback
        }

        Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(1.5f, Unit.Centimetre);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontSize(11).FontFamily("Inter"));

                page.Header()
                    .Column(col =>
                    {
                        col.Item().Text($"{student.FirstName} {student.LastName}")
                            .Bold()
                            .FontSize(24)
                            .FontColor(Colors.Teal.Darken3);

                        col.Item().Text($"{student.Department} | ID: {student.InstitutionalId} | CGPA: {student.CGPA:F2}")
                            .FontSize(11)
                            .FontColor(Colors.Grey.Darken2);

                        col.Item().PaddingTop(5).LineHorizontal(1).LineColor(Colors.Teal.Lighten2);
                    });

                page.Content()
                    .PaddingVertical(10)
                    .Column(col =>
                    {
                        if (!string.IsNullOrWhiteSpace(summary) || !string.IsNullOrWhiteSpace(student.Biography))
                        {
                            col.Item().PaddingTop(10).Text("Professional Summary").Bold().FontSize(14).FontColor(Colors.Teal.Darken2);
                            col.Item().Text(!string.IsNullOrWhiteSpace(summary) ? summary : student.Biography!).FontSize(10);
                        }

                        if (!string.IsNullOrWhiteSpace(educationText))
                        {
                            col.Item().PaddingTop(10).Text("Education").Bold().FontSize(14).FontColor(Colors.Teal.Darken2);
                            col.Item().Text(educationText).FontSize(10);
                        }

                        if (!string.IsNullOrWhiteSpace(experienceText))
                        {
                            col.Item().PaddingTop(10).Text("Experience & Projects").Bold().FontSize(14).FontColor(Colors.Teal.Darken2);
                            col.Item().Text(experienceText).FontSize(10);
                        }

                        if (skillsList.Count > 0)
                        {
                            col.Item().PaddingTop(10).Text("Key Skills & Technologies").Bold().FontSize(14).FontColor(Colors.Teal.Darken2);
                            col.Item().Text(string.Join(", ", skillsList.Where(s => !string.IsNullOrWhiteSpace(s)))).FontSize(10);
                        }
                    });

                page.Footer()
                    .AlignCenter()
                    .Text(x =>
                    {
                        x.Span("Generated by InternLink Career Portal • Page ");
                        x.CurrentPageNumber();
                    });
            });
        }).GeneratePdf(stream);

        return stream.ToArray();
    }
}
