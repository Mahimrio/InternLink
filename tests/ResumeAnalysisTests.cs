using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;
using InternLinkApi.Services.ResumeAnalysisService;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;

namespace InternLinkApi.Tests;

public class ResumeAnalysisTests
{
    private static readonly Guid UserId = Guid.NewGuid();
    private static readonly Guid ResumeId = Guid.NewGuid();

    private static (ResumeAnalysisService service, ILlmClient llm) CreateService()
    {
        var student = new Student { Id = Guid.NewGuid(), UserId = UserId, FirstName = "Test", LastName = "Student" };
        var resume = new Resume { Id = ResumeId, StudentId = student.Id, DynamicJsonData = "{\"education\":{}}", DocumentPath = "" };

        var studentRepo = Substitute.For<IStudentRepository>();
        studentRepo.GetByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns(student);

        var resumeRepo = Substitute.For<IResumeRepository>();
        resumeRepo.GetByIdAndStudentIdAsync(ResumeId, student.Id, Arg.Any<CancellationToken>()).Returns(resume);

        var jobRepo = Substitute.For<IJobRepository>();
        var llm = Substitute.For<ILlmClient>();

        var service = new ResumeAnalysisService(
            llm, studentRepo, resumeRepo, jobRepo, NullLogger<ResumeAnalysisService>.Instance);

        return (service, llm);
    }

    private static LlmResponse Reply(string content) => new(content, 100, 50, 0.001m);

    [Fact]
    public async Task Malformed_reply_is_retried_once_with_clarifying_instruction_then_parsed()
    {
        var (service, llm) = CreateService();
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), IntegrationFeature.AtsScoring, UserId, Arg.Any<CancellationToken>())
            .Returns(
                Reply("Sure! Here is your analysis: score is 85."),
                Reply("{\"atsScore\":85,\"grammarIssues\":[\"Passive voice in summary\"],\"structureCritique\":\"Solid layout.\",\"missingKeywords\":[\"REST\"]}"));

        var result = await service.GetAtsScoreAsync(UserId, ResumeId);

        Assert.Equal(85, result.AtsScore);
        Assert.Single(result.GrammarIssues);
        await llm.Received(1).CompletePromptAsync(
            Arg.Is<string>(s => s.Contains("was not valid JSON")),
            Arg.Any<string>(), IntegrationFeature.AtsScoring, UserId, Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Two_malformed_replies_produce_sentinel_fallback_not_an_error()
    {
        var (service, llm) = CreateService();
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), Arg.Any<IntegrationFeature>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(Reply("not json at all"), Reply("still { not json"));

        var result = await service.GetAtsScoreAsync(UserId, ResumeId);

        Assert.Equal(-1, result.AtsScore);
        Assert.Empty(result.GrammarIssues);
        Assert.Contains("temporarily unavailable", result.StructureCritique);
    }

    [Fact]
    public async Task Markdown_fenced_json_is_parsed_without_retry()
    {
        var (service, llm) = CreateService();
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), Arg.Any<IntegrationFeature>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(Reply("```json\n{\"atsScore\":72,\"grammarIssues\":[],\"structureCritique\":\"Fine.\",\"missingKeywords\":[]}\n```"));

        var result = await service.GetAtsScoreAsync(UserId, ResumeId);

        Assert.Equal(72, result.AtsScore);
        await llm.Received(1).CompletePromptAsync(
            Arg.Any<string>(), Arg.Any<string>(), Arg.Any<IntegrationFeature>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Provider_failure_produces_sentinel_fallback()
    {
        var (service, llm) = CreateService();
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), Arg.Any<IntegrationFeature>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns<LlmResponse>(_ => throw new AiServiceException("The AI service is currently unavailable."));

        var result = await service.GetAtsScoreAsync(UserId, ResumeId);

        Assert.Equal(-1, result.AtsScore);
    }
}
