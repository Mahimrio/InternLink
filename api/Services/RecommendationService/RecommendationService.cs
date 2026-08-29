using System.Security.Cryptography;
using System.Text;
using InternLinkApi.DTOs;
using InternLinkApi.Helpers;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;
using Microsoft.Extensions.Caching.Memory;

namespace InternLinkApi.Services.RecommendationService;

public class RecommendationService : IRecommendationService
{
    /// <summary>Below this many open jobs, LLM ranking adds nothing — overlap scoring is used instead.</summary>
    private const int CandidatePoolSize = 15;

    private static readonly TimeSpan CacheTtl = TimeSpan.FromHours(1);

    private readonly ILlmClient _llm;
    private readonly IStudentRepository _studentRepository;
    private readonly IJobRepository _jobRepository;
    private readonly IApplicationRepository _applicationRepository;
    private readonly IMemoryCache _cache;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
        ILlmClient llm,
        IStudentRepository studentRepository,
        IJobRepository jobRepository,
        IApplicationRepository applicationRepository,
        IMemoryCache cache,
        ILogger<RecommendationService> logger)
    {
        _llm = llm;
        _studentRepository = studentRepository;
        _jobRepository = jobRepository;
        _applicationRepository = applicationRepository;
        _cache = cache;
        _logger = logger;
    }

    public async Task<IReadOnlyList<JobRecommendationDto>> GetRecommendedJobsAsync(
        Guid userId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetWithSkillsByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        // The skill-set hash is part of the key, so a skill change naturally
        // produces a cache miss instead of needing manual invalidation.
        var studentSkillIds = student.StudentSkills.Select(ss => ss.SkillId).OrderBy(id => id).ToList();
        var cacheKey = $"job-recs:{student.Id}:{HashSkillSet(studentSkillIds)}";

        if (_cache.TryGetValue(cacheKey, out IReadOnlyList<JobRecommendationDto>? cached) && cached is not null)
        {
            return cached;
        }

        var jobs = await _jobRepository.GetApprovedOpenJobsAsync(null, null, ct);
        var appliedJobIds = await _applicationRepository.GetAppliedJobIdsForStudentAsync(student.Id, ct);

        var skillSet = studentSkillIds.ToHashSet();
        var scored = jobs
            .Select(j => (Job: j, Overlap: j.JobSkills?.Count(js => skillSet.Contains(js.SkillId)) ?? 0))
            .OrderByDescending(x => x.Overlap)
            .ThenByDescending(x => x.Job.DeadLine) // ties: fresher postings surface first
            .ToList();

        IReadOnlyList<JobRecommendationDto> result;
        if (jobs.Count < CandidatePoolSize)
        {
            // Too few jobs to rank meaningfully — don't spend an AI call.
            result = scored.Select(x => ToOverlapRecommendation(x.Job, x.Overlap, appliedJobIds)).ToList();
        }
        else
        {
            var candidates = scored.Take(CandidatePoolSize).ToList();
            result = await RankWithLlmAsync(student, candidates, appliedJobIds, userId, ct)
                // Provider failure or unparseable output: degrade to overlap ranking.
                ?? candidates.Select(x => ToOverlapRecommendation(x.Job, x.Overlap, appliedJobIds)).ToList();
        }

        _cache.Set(cacheKey, result, CacheTtl);
        return result;
    }

    private async Task<IReadOnlyList<JobRecommendationDto>?> RankWithLlmAsync(
        Student student,
        List<(Job Job, int Overlap)> candidates,
        HashSet<Guid> appliedJobIds,
        Guid userId,
        CancellationToken ct)
    {
        const string systemPrompt =
            "You are a career-matching engine ranking internship postings for a specific university student. " +
            "Respond with ONLY valid JSON matching this exact schema, no markdown fences, no prose before or after: " +
            "{ \"rankings\": [{ \"jobId\": string, \"matchPercentage\": number between 0 and 100, \"reason\": string }] }. " +
            "Include every candidate job exactly once, using its id verbatim. " +
            "Each reason must be one sentence, specific to this student-job pair (reference their actual skills, interests or CGPA), never generic.";

        var studentSkills = student.StudentSkills
            .Select(ss => $"{ss.Skill?.SkillName ?? ss.SkillId.ToString()} (proficiency {ss.ProficiencyLevel}/5)");

        var promptBuilder = new StringBuilder()
            .AppendLine("Student profile:")
            .AppendLine($"- Department: {student.Department}")
            .AppendLine($"- CGPA: {student.CGPA}")
            .AppendLine($"- Skills: {string.Join(", ", studentSkills)}")
            .AppendLine($"- Interests: {student.Interests ?? "not specified"}")
            .AppendLine()
            .AppendLine("Candidate jobs:");

        foreach (var (job, _) in candidates)
        {
            var requiredSkills = job.JobSkills?
                .Select(js => $"{js.Skill?.SkillName ?? js.SkillId.ToString()} (weight {js.RequiredImportanceWeight})")
                ?? [];
            promptBuilder
                .AppendLine($"- id: {job.Id}")
                .AppendLine($"  title: {job.Title}")
                .AppendLine($"  company: {job.Company?.CompanyName}")
                .AppendLine($"  requiredSkills: {string.Join(", ", requiredSkills)}")
                .AppendLine($"  description: {Truncate(job.CoreDescription, 300)}");
        }

        var envelope = await _llm.CompleteAndParseJsonAsync<RankingsEnvelope>(
            systemPrompt, promptBuilder.ToString(), IntegrationFeature.JobMatching, userId, _logger, ct);

        if (envelope?.Rankings is null)
        {
            return null;
        }

        var candidateJobs = candidates.ToDictionary(x => x.Job.Id, x => x.Job);
        var recommendations = new List<JobRecommendationDto>();
        foreach (var ranking in envelope.Rankings)
        {
            // LLMs occasionally hallucinate ids — silently drop anything not in the candidate set.
            if (!Guid.TryParse(ranking.JobId, out var jobId) || !candidateJobs.TryGetValue(jobId, out var job))
            {
                _logger.LogWarning("LLM returned unknown jobId {JobId} in rankings; dropping it.", ranking.JobId);
                continue;
            }

            recommendations.Add(new JobRecommendationDto
            {
                Job = JobMapper.ToDto(job, appliedJobIds.Contains(job.Id)),
                MatchPercentage = Math.Clamp(ranking.MatchPercentage, 0, 100),
                Reason = ranking.Reason ?? string.Empty,
            });
        }

        if (recommendations.Count == 0)
        {
            return null;
        }

        return recommendations.OrderByDescending(r => r.MatchPercentage).ToList();
    }

    private static JobRecommendationDto ToOverlapRecommendation(Job job, int overlap, HashSet<Guid> appliedJobIds)
    {
        var requiredCount = job.JobSkills?.Count ?? 0;
        var matchPercentage = requiredCount == 0 ? 0 : (int)Math.Round(100.0 * overlap / requiredCount);
        var reason = requiredCount == 0
            ? "This role lists no specific skill requirements."
            : $"You have {overlap} of the {requiredCount} skills this role requires.";

        return new JobRecommendationDto
        {
            Job = JobMapper.ToDto(job, appliedJobIds.Contains(job.Id)),
            MatchPercentage = matchPercentage,
            Reason = reason,
        };
    }

    private static string HashSkillSet(IEnumerable<Guid> orderedSkillIds)
    {
        var joined = string.Join(",", orderedSkillIds);
        return Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(joined)))[..16];
    }

    private static string Truncate(string value, int maxLength) =>
        value.Length <= maxLength ? value : value[..maxLength];

    private sealed record RankingsEnvelope(List<LlmRanking> Rankings);

    private sealed record LlmRanking(string JobId, int MatchPercentage, string? Reason);
}
