using InternLinkApi.Helpers;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.JobService;

public class JobService : IJobService
{
    private readonly IJobRepository _jobRepo;

    public JobService(IJobRepository jobRepo)
    {
        _jobRepo = jobRepo;
    }

    public async Task<IReadOnlyList<DTOs.JobDto>> GetActiveJobsForStudentAsync(
        Guid studentId, string? locationType, string? keyword, CancellationToken ct = default)
    {
        var jobs = await _jobRepo.GetApprovedOpenJobsAsync(locationType, keyword, ct);

        // Defensive check: filter out past-deadline jobs even if still marked approved
        var active = jobs
            .Where(j => j.DeadLine >= DateTimeOffset.UtcNow)
            .ToList();

        return JobMapper.ToDtoList(active);
    }
}
