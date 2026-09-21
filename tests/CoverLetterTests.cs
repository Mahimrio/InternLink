using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;
using InternLinkApi.Services.CoverLetterService;
using InternLinkApi.Services.ResumeService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace InternLinkApi.Tests;

public class CoverLetterTests
{
    private static readonly Guid TestUserId = Guid.NewGuid();
    private static readonly Guid TestStudentId = Guid.NewGuid();
    private static readonly Guid TestJobId = Guid.NewGuid();

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"CoverLetterTestDb_{Guid.NewGuid()}")
            .Options;
        return new ApplicationDbContext(options);
    }

    private static (CoverLetterService service, ILlmClient llm, ICoverLetterPdfService pdfService, ApplicationDbContext db) CreateService()
    {
        var db = CreateInMemoryDbContext();

        var student = new Student
        {
            Id = TestStudentId,
            UserId = TestUserId,
            FirstName = "Jane",
            LastName = "Doe",
            Department = "Computer Science and Engineering",
            CGPA = 3.85m,
            InstitutionalId = "2022-CSE-001",
            Biography = "Passionate about full-stack engineering and cloud systems.",
            Interests = "Web APIs, Distributed Systems"
        };
        db.Students.Add(student);

        var company = new Company
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            CompanyName = "TechCorp Labs",
            IndustrySector = "Software Development",
            VerificationStatus = VerificationStatus.Verified
        };
        db.Companies.Add(company);

        var job = new Job
        {
            Id = TestJobId,
            CompanyId = company.Id,
            Company = company,
            Title = "Backend Engineering Intern",
            CoreDescription = "Develop high-throughput REST APIs and microservices using modern .NET and PostgreSQL.",
            SelectionCriteria = "Experience with C#, ASP.NET Core, relational databases, and good unit testing habits.",
            LocationType = LocationType.Hybrid,
            DeadLine = DateTimeOffset.UtcNow.AddDays(14),
            IsApproved = true,
            IsClosed = false
        };
        db.Jobs.Add(job);

        var resume = new Resume
        {
            Id = Guid.NewGuid(),
            StudentId = TestStudentId,
            DocumentPath = "resumes/jane/sample.pdf",
            DynamicJsonData = "{\"personal-info\":{\"summary\":\"Full-stack student builder\"},\"skills\":[\"C#\",\"PostgreSQL\",\"Docker\"]}",
            LastModified = DateTimeOffset.UtcNow
        };
        db.Resumes.Add(resume);

        db.SaveChanges();

        var studentRepo = Substitute.For<IStudentRepository>();
        studentRepo.GetByUserIdAsync(TestUserId, Arg.Any<CancellationToken>()).Returns(student);

        var jobRepo = Substitute.For<IJobRepository>();
        jobRepo.GetByIdAsync(TestJobId, Arg.Any<CancellationToken>()).Returns(job);

        var resumeRepo = Substitute.For<IResumeRepository>();
        resumeRepo.GetByStudentIdAsync(TestStudentId, Arg.Any<CancellationToken>()).Returns(new List<Resume> { resume });

        var appRepo = Substitute.For<IApplicationRepository>();
        var llm = Substitute.For<ILlmClient>();
        var pdfService = Substitute.For<ICoverLetterPdfService>();
        var storageService = Substitute.For<ISupabaseStorageService>();

        var service = new CoverLetterService(
            studentRepo,
            jobRepo,
            resumeRepo,
            appRepo,
            llm,
            pdfService,
            storageService,
            db,
            NullLogger<CoverLetterService>.Instance);

        return (service, llm, pdfService, db);
    }

    [Fact]
    public async Task GenerateAsync_InvokesLlmClientWithCoverLetterFeatureAndReturnsCleanText()
    {
        var (service, llm, _, _) = CreateService();

        var expectedText = "Dear Hiring Team at TechCorp Labs,\n\nI am writing to express my enthusiasm for the Backend Engineering Intern position...";
        llm.CompletePromptAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            IntegrationFeature.CoverLetter,
            TestUserId,
            Arg.Any<CancellationToken>())
            .Returns(new LlmResponse(expectedText, 250, 200, 0.0012m));

        var result = await service.GenerateAsync(TestUserId, TestJobId);

        Assert.NotNull(result);
        Assert.Equal(expectedText, result.GeneratedText);

        await llm.Received(1).CompletePromptAsync(
            Arg.Is<string>(p => p.Contains("cover letter")),
            Arg.Is<string>(p => p.Contains("TechCorp Labs") && p.Contains("Backend Engineering Intern")),
            IntegrationFeature.CoverLetter,
            TestUserId,
            Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task GenerateAsync_WhenLlmThrowsAiServiceException_ReturnsGracefulFallback()
    {
        var (service, llm, _, _) = CreateService();

        llm.CompletePromptAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            IntegrationFeature.CoverLetter,
            TestUserId,
            Arg.Any<CancellationToken>())
            .ThrowsAsync(new AiServiceException("Provider timeout"));

        var result = await service.GenerateAsync(TestUserId, TestJobId);

        Assert.NotNull(result);
        Assert.Contains("TechCorp Labs", result.GeneratedText);
        Assert.Contains("Backend Engineering Intern", result.GeneratedText);
        Assert.Contains("Jane Doe", result.GeneratedText);
    }

    [Fact]
    public async Task SaveAsync_PersistsCoverLetterAndUpdatesExistingApplication()
    {
        var (service, _, _, db) = CreateService();

        // Add pre-existing application
        var application = new Application
        {
            Id = Guid.NewGuid(),
            JobId = TestJobId,
            StudentId = TestStudentId,
            ApplicationStatus = ApplicationStatus.Applied,
            SubmittedAt = DateTimeOffset.UtcNow
        };
        db.Applications.Add(application);
        await db.SaveChangesAsync();

        var letterContent = "Custom edited cover letter text by student.";
        var saved = await service.SaveAsync(TestUserId, TestJobId, letterContent);

        Assert.NotNull(saved);
        Assert.Equal(letterContent, saved.Content);

        // Verify DB entity
        var inDb = await db.CoverLetters.FirstOrDefaultAsync(cl => cl.StudentId == TestStudentId && cl.JobId == TestJobId);
        Assert.NotNull(inDb);
        Assert.Equal(letterContent, inDb.Content);

        // Verify application was updated
        var updatedApp = await db.Applications.FirstOrDefaultAsync(a => a.Id == application.Id);
        Assert.NotNull(updatedApp);
        Assert.Equal(letterContent, updatedApp.CoverLetterText);
    }

    [Fact]
    public async Task GeneratePdfAsync_CallsPdfServiceAndReturnsSignedUrl()
    {
        var (service, _, pdfService, db) = CreateService();

        var expectedUrl = "https://supabase.co/storage/v1/object/sign/resumes/cover-letters/test.pdf";
        var expectedPath = "cover-letters/test.pdf";

        pdfService.RenderAndUploadPdfAsync(
            Arg.Any<Student>(),
            Arg.Any<Job>(),
            Arg.Is<string>(s => s.Contains("Custom PDF text")),
            Arg.Any<CancellationToken>())
            .Returns((expectedPath, expectedUrl));

        var result = await service.GeneratePdfAsync(TestUserId, TestJobId, "Custom PDF text for export");

        Assert.NotNull(result);
        Assert.Equal(expectedUrl, result.DownloadUrl);
        Assert.Equal(expectedPath, result.DocumentPath);
    }
}
