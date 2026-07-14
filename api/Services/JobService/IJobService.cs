using InternLinkApi.DTOs;

namespace InternLinkApi.Services.JobService;

public interface IJobService
{
    Task<IReadOnlyList<JobDto>> GetActiveJobsForStudentAsync(Guid studentId, string? locationType, string? keyword, CancellationToken ct = default);
}
