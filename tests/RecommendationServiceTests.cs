using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;
using InternLinkApi.Services.RecommendationService;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace InternLinkApi.Tests;

public class RecommendationServiceTests
{
    private static readonly Guid UserId = Guid.NewGuid();

    private static Skill MakeSkill(string name) =>
        new() { Id = Guid.NewGuid(), SkillName = name };

    private static Student MakeStudent(params Skill[] skills)
    {
        var student = new Student
        {
            Id = Guid.NewGuid(),
            UserId = UserId,
            FirstName = "Test",
            LastName = "Student",
            Department = "CSE",
            CGPA = 3.5m,
        };
        student.StudentSkills = skills
            .Select(s => new StudentSkill { StudentId = student.Id, SkillId = s.Id, Skill = s, ProficiencyLevel = 4 })
            .ToList();
        return student;
    }

    private static Job MakeJob(string title, DateTimeOffset deadline, params Skill[] requiredSkills)
    {
        var job = new Job
        {
            Id = Guid.NewGuid(),
            Title = title,
            CoreDescription = $"{title} description",
            SelectionCriteria = "Criteria",
            DeadLine = deadline,
            IsApproved = true,
            Company = new Company { Id = Guid.NewGuid(), CompanyName = "TestCo" },
        };
        job.JobSkills = requiredSkills
            .Select(s => new JobSkill { JobId = job.Id, SkillId = s.Id, Skill = s, RequiredImportanceWeight = 3 })
            .ToList();
        return job;
    }

    private static (RecommendationService service, ILlmClient llm, IStudentRepository studentRepo) CreateService(
        Student student, IReadOnlyList<Job> jobs, IMemoryCache? cache = null)
    {
        var studentRepo = Substitute.For<IStudentRepository>();
        studentRepo.GetWithSkillsByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns(student);

        var jobRepo = Substitute.For<IJobRepository>();
        jobRepo.GetApprovedOpenJobsAsync(null, null, Arg.Any<CancellationToken>()).Returns(jobs);

        var applicationRepo = Substitute.For<IApplicationRepository>();
        applicationRepo.GetAppliedJobIdsForStudentAsync(student.Id, Arg.Any<CancellationToken>())
            .Returns(new HashSet<Guid>());

        var llm = Substitute.For<ILlmClient>();

        var service = new RecommendationService(
            llm, studentRepo, jobRepo, applicationRepo,
            cache ?? new MemoryCache(new MemoryCacheOptions()),
            NullLogger<RecommendationService>.Instance);

        return (service, llm, studentRepo);
    }

    private static LlmResponse Reply(string content) => new(content, 100, 50, 0.001m);

    [Fact]
    public async Task Fewer_than_fifteen_jobs_skips_llm_and_ranks_by_overlap()
    {
        var csharp = MakeSkill("C#");
        var sql = MakeSkill("SQL");
        var react = MakeSkill("React");
        var student = MakeStudent(csharp, sql);

        var now = DateTimeOffset.UtcNow;
        var strongMatch = MakeJob("Backend Intern", now.AddDays(10), csharp, sql);
        var partialMatch = MakeJob("Full-Stack Intern", now.AddDays(5), csharp, react);
        var noMatch = MakeJob("Frontend Intern", now.AddDays(7), react);

        var (service, llm, _) = CreateService(student, [noMatch, partialMatch, strongMatch]);

        var result = await service.GetRecommendedJobsAsync(UserId);

        await llm.DidNotReceiveWithAnyArgs().CompletePromptAsync(default!, default!, default, default, default);
        Assert.Equal(3, result.Count);
        Assert.Equal(strongMatch.Id, result[0].Job.Id);
        Assert.Equal(100, result[0].MatchPercentage);
        Assert.Equal(partialMatch.Id, result[1].Job.Id);
        Assert.Equal(50, result[1].MatchPercentage);
        Assert.Equal(0, result[2].MatchPercentage);
    }

    [Fact]
    public async Task Enough_jobs_trigger_one_batched_llm_call_and_hallucinated_ids_are_dropped()
    {
        var csharp = MakeSkill("C#");
        var student = MakeStudent(csharp);

        var now = DateTimeOffset.UtcNow;
        var jobs = Enumerable.Range(0, 16).Select(i => MakeJob($"Job {i}", now.AddDays(i + 1), csharp)).ToList();

        var (service, llm, _) = CreateService(student, jobs);

        var rankedJob = jobs[^1]; // latest deadline → highest pre-filter rank
        var llmJson =
            $"{{\"rankings\":[{{\"jobId\":\"{rankedJob.Id}\",\"matchPercentage\":88,\"reason\":\"Strong C# fit.\"}}," +
            $"{{\"jobId\":\"{Guid.NewGuid()}\",\"matchPercentage\":99,\"reason\":\"Hallucinated job.\"}}]}}";
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), IntegrationFeature.JobMatching, UserId, Arg.Any<CancellationToken>())
            .Returns(Reply(llmJson));

        var result = await service.GetRecommendedJobsAsync(UserId);

        await llm.ReceivedWithAnyArgs(1).CompletePromptAsync(default!, default!, default, default, default);
        Assert.Single(result); // the hallucinated id was silently dropped
        Assert.Equal(rankedJob.Id, result[0].Job.Id);
        Assert.Equal(88, result[0].MatchPercentage);
        Assert.Equal("Strong C# fit.", result[0].Reason);
    }

    [Fact]
    public async Task Llm_failure_falls_back_to_overlap_ranking_instead_of_erroring()
    {
        var csharp = MakeSkill("C#");
        var student = MakeStudent(csharp);

        var now = DateTimeOffset.UtcNow;
        var jobs = Enumerable.Range(0, 16).Select(i => MakeJob($"Job {i}", now.AddDays(i + 1), csharp)).ToList();

        var (service, llm, _) = CreateService(student, jobs);
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), Arg.Any<IntegrationFeature>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new AiServiceException("AI unavailable."));

        var result = await service.GetRecommendedJobsAsync(UserId);

        Assert.Equal(15, result.Count); // candidate pool, overlap-ranked
        Assert.All(result, r => Assert.Equal(100, r.MatchPercentage));
    }

    [Fact]
    public async Task Second_call_within_ttl_is_served_from_cache_without_a_new_llm_call()
    {
        var csharp = MakeSkill("C#");
        var student = MakeStudent(csharp);

        var now = DateTimeOffset.UtcNow;
        var jobs = Enumerable.Range(0, 16).Select(i => MakeJob($"Job {i}", now.AddDays(i + 1), csharp)).ToList();

        var (service, llm, _) = CreateService(student, jobs);
        var llmJson = $"{{\"rankings\":[{{\"jobId\":\"{jobs[0].Id}\",\"matchPercentage\":70,\"reason\":\"Fit.\"}}]}}";
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), IntegrationFeature.JobMatching, UserId, Arg.Any<CancellationToken>())
            .Returns(Reply(llmJson));

        var first = await service.GetRecommendedJobsAsync(UserId);
        var second = await service.GetRecommendedJobsAsync(UserId);

        await llm.ReceivedWithAnyArgs(1).CompletePromptAsync(default!, default!, default, default, default);
        Assert.Same(first, second);
    }

    [Fact]
    public async Task Changing_the_students_skills_busts_the_cache()
    {
        var csharp = MakeSkill("C#");
        var python = MakeSkill("Python");
        var studentBefore = MakeStudent(csharp);
        var studentAfter = MakeStudent(csharp, python);
        studentAfter.Id = studentBefore.Id; // same student, different skill set

        var now = DateTimeOffset.UtcNow;
        var jobs = Enumerable.Range(0, 16).Select(i => MakeJob($"Job {i}", now.AddDays(i + 1), csharp)).ToList();

        var (service, llm, studentRepo) = CreateService(studentBefore, jobs);
        var llmJson = $"{{\"rankings\":[{{\"jobId\":\"{jobs[0].Id}\",\"matchPercentage\":70,\"reason\":\"Fit.\"}}]}}";
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), IntegrationFeature.JobMatching, UserId, Arg.Any<CancellationToken>())
            .Returns(Reply(llmJson));

        await service.GetRecommendedJobsAsync(UserId);

        studentRepo.GetWithSkillsByUserIdAsync(UserId, Arg.Any<CancellationToken>()).Returns(studentAfter);
        await service.GetRecommendedJobsAsync(UserId);

        // Different skill hash → cache miss → a second LLM call.
        await llm.ReceivedWithAnyArgs(2).CompletePromptAsync(default!, default!, default, default, default);
    }
}
