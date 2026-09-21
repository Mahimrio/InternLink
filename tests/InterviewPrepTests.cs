using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;
using InternLinkApi.Services.InterviewPrepService;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using Xunit;

namespace InternLinkApi.Tests;

public class InterviewPrepTests
{
    private static readonly Guid TestUserId = Guid.NewGuid();
    private static readonly Guid TestStudentId = Guid.NewGuid();
    private static readonly Guid TestJobId = Guid.NewGuid();

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: $"InterviewPrepTestDb_{Guid.NewGuid()}")
            .Options;
        return new ApplicationDbContext(options);
    }

    private static (InterviewPrepService service, ILlmClient llm, ApplicationDbContext db) CreateService()
    {
        var db = CreateInMemoryDbContext();

        var student = new Student
        {
            Id = TestStudentId,
            UserId = TestUserId,
            FirstName = "Alex",
            LastName = "Morgan",
            Department = "Computer Science and Engineering",
            CGPA = 3.90m,
            InstitutionalId = "2022-CSE-042",
            Biography = "Passionate full-stack developer with interest in distributed systems.",
            Interests = "Backend, Cloud Computing"
        };
        db.Students.Add(student);

        var company = new Company
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            CompanyName = "CloudScale Innovations",
            IndustrySector = "Cloud Infrastructure",
            VerificationStatus = VerificationStatus.Verified
        };
        db.Companies.Add(company);

        var job = new Job
        {
            Id = TestJobId,
            CompanyId = company.Id,
            Company = company,
            Title = "Cloud Backend Intern",
            CoreDescription = "Build scalable microservices and async job runners.",
            SelectionCriteria = "Experience with C#, ASP.NET Core, Docker, and PostgreSQL.",
            LocationType = LocationType.Hybrid,
            DeadLine = DateTimeOffset.UtcNow.AddDays(30),
            IsApproved = true,
            IsClosed = false
        };
        db.Jobs.Add(job);
        db.SaveChanges();

        var studentRepo = Substitute.For<IStudentRepository>();
        studentRepo.GetByUserIdAsync(TestUserId, Arg.Any<CancellationToken>()).Returns(student);
        studentRepo.GetWithSkillsByUserIdAsync(TestUserId, Arg.Any<CancellationToken>()).Returns(student);

        var jobRepo = Substitute.For<IJobRepository>();
        jobRepo.GetByIdAsync(TestJobId, Arg.Any<CancellationToken>()).Returns(job);

        var llm = Substitute.For<ILlmClient>();

        var service = new InterviewPrepService(
            db,
            studentRepo,
            jobRepo,
            llm,
            NullLogger<InterviewPrepService>.Instance);

        return (service, llm, db);
    }

    [Fact]
    public async Task GenerateQuestionsAsync_ReturnsParsedQuestions_WhenLlmSucceeds()
    {
        var (service, llm, _) = CreateService();

        var mockJson = @"[
            { ""questionText"": ""How does dependency injection work in ASP.NET Core?"", ""category"": ""Technical"" },
            { ""questionText"": ""Tell me about a time you resolved a merge conflict."", ""category"": ""Situational"" },
            { ""questionText"": ""Why do you want to work at CloudScale Innovations?"", ""category"": ""HR"" }
        ]";

        llm.CompletePromptAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            IntegrationFeature.InterviewQuestions,
            TestUserId,
            Arg.Any<CancellationToken>())
            .Returns(new LlmResponse(mockJson, 100, 50, 0.0001m));

        var result = await service.GenerateQuestionsAsync(TestUserId, "Backend Engineer", TestJobId);

        Assert.NotNull(result);
        Assert.Equal(3, result.Questions.Count);
        Assert.Equal("Technical", result.Questions[0].Category);
        Assert.Equal("How does dependency injection work in ASP.NET Core?", result.Questions[0].QuestionText);
        Assert.Equal("Situational", result.Questions[1].Category);
        Assert.Equal("HR", result.Questions[2].Category);
    }

    [Fact]
    public async Task GenerateQuestionsAsync_ReturnsFallbackQuestions_WhenLlmThrowsAiServiceException()
    {
        var (service, llm, _) = CreateService();

        llm.CompletePromptAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            IntegrationFeature.InterviewQuestions,
            TestUserId,
            Arg.Any<CancellationToken>())
            .Throws(new AiServiceException("Rate limit reached"));

        var result = await service.GenerateQuestionsAsync(TestUserId, "Backend Engineer", null);

        Assert.NotNull(result);
        Assert.NotEmpty(result.Questions);
        Assert.Contains(result.Questions, q => q.Category == "Technical");
        Assert.Contains(result.Questions, q => q.Category == "Situational");
        Assert.Contains(result.Questions, q => q.Category == "HR");
    }

    [Fact]
    public async Task StartSessionAsync_CreatesInProgressSessionWithOpeningQuestion()
    {
        var (service, llm, db) = CreateService();

        llm.CompletePromptAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            IntegrationFeature.MockInterview,
            TestUserId,
            Arg.Any<CancellationToken>())
            .Returns(new LlmResponse("Welcome! Tell me about yourself and why you're interested in this role.", 50, 20, 0.00005m));

        var result = await service.StartSessionAsync(TestUserId, "Backend Engineer", TestJobId);

        Assert.NotEqual(Guid.Empty, result.SessionId);
        Assert.Equal("Backend Engineer", result.Role);
        Assert.Contains("Welcome!", result.FirstQuestion);

        var sessionInDb = await db.MockInterviewSessions.FindAsync(result.SessionId);
        Assert.NotNull(sessionInDb);
        Assert.Equal(MockInterviewStatus.InProgress, sessionInDb.Status);
        Assert.Contains("Welcome!", sessionInDb.TranscriptJson);
    }

    [Fact]
    public async Task SendMessageAsync_AppendsCandidateAndAiReplyToTranscript()
    {
        var (service, llm, db) = CreateService();

        llm.CompletePromptAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            IntegrationFeature.MockInterview,
            TestUserId,
            Arg.Any<CancellationToken>())
            .Returns(
                new LlmResponse("Welcome! Tell me about yourself.", 50, 20, 0.00005m),
                new LlmResponse("Great background! How do you handle async deadlocks?", 60, 25, 0.00006m)
            );

        var startResult = await service.StartSessionAsync(TestUserId, "Backend Engineer", null);

        var sendResult = await service.SendMessageAsync(
            TestUserId, startResult.SessionId, "I have built full-stack applications with ASP.NET Core.");

        Assert.Equal("Great background! How do you handle async deadlocks?", sendResult.AiReply);
        Assert.False(sendResult.IsCompleted);

        var sessionInDb = await db.MockInterviewSessions.FindAsync(startResult.SessionId);
        Assert.NotNull(sessionInDb);
        Assert.Contains("I have built full-stack applications", sessionInDb.TranscriptJson);
        Assert.Contains("Great background!", sessionInDb.TranscriptJson);
    }

    [Fact]
    public async Task EndSessionAsync_MarksSessionCompletedAndGeneratesCoachingReport()
    {
        var (service, llm, db) = CreateService();

        var mockReportJson = @"{
            ""accuracySummary"": ""The candidate displayed solid fundamental knowledge of backend systems."",
            ""logicGaps"": [""Could have elaborated more on exception handling patterns.""],
            ""improvementSuggestions"": [""Structure your project examples with the STAR method.""]
        }";

        llm.CompletePromptAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            IntegrationFeature.MockInterview,
            TestUserId,
            Arg.Any<CancellationToken>())
            .Returns(
                new LlmResponse("Welcome! Tell me about yourself.", 50, 20, 0.00005m),
                new LlmResponse(mockReportJson, 150, 80, 0.0002m)
            );

        var startResult = await service.StartSessionAsync(TestUserId, "Backend Engineer", null);
        var report = await service.EndSessionAsync(TestUserId, startResult.SessionId);

        Assert.NotNull(report);
        Assert.Contains("solid fundamental knowledge", report.AccuracySummary);
        Assert.Single(report.LogicGaps);
        Assert.Single(report.ImprovementSuggestions);

        var sessionInDb = await db.MockInterviewSessions.FindAsync(startResult.SessionId);
        Assert.NotNull(sessionInDb);
        Assert.Equal(MockInterviewStatus.Completed, sessionInDb.Status);
        Assert.NotNull(sessionInDb.CompletedAt);
        Assert.NotNull(sessionInDb.ReportJson);
    }

    [Fact]
    public async Task GetSessionAsync_ReturnsDetailedMessagesAndReport()
    {
        var (service, llm, _) = CreateService();

        llm.CompletePromptAsync(
            Arg.Any<string>(),
            Arg.Any<string>(),
            IntegrationFeature.MockInterview,
            TestUserId,
            Arg.Any<CancellationToken>())
            .Returns(new LlmResponse("Welcome to the interview!", 50, 20, 0.00005m));

        var startResult = await service.StartSessionAsync(TestUserId, "Frontend Engineer", null);
        var detail = await service.GetSessionAsync(TestUserId, startResult.SessionId);

        Assert.NotNull(detail);
        Assert.Equal(startResult.SessionId, detail.SessionId);
        Assert.Equal("Frontend Engineer", detail.Role);
        Assert.Equal("InProgress", detail.Status);
        Assert.Single(detail.Messages);
        Assert.Equal("interviewer", detail.Messages[0].Role);
    }
}
