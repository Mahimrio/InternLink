using InternLinkApi.DTOs;

namespace InternLinkApi.Services.JobService;

public interface IJobService
{
    Task<PagedResultDto<JobDto>> GetPagedJobsForStudentAsync(
        Guid userId,
        string? locationType,
        string? keyword,
        bool? relevantToMe,
        int page,
        int pageSize,
        CancellationToken ct = default);

    Task<JobDto?> GetJobDetailsForStudentAsync(Guid userId, Guid jobId, CancellationToken ct = default);

    Task<ApplicationDto> ApplyToJobAsync(Guid userId, Guid jobId, Guid resumeId, CancellationToken ct = default);

    Task<IReadOnlyList<ApplicationDto>> GetStudentApplicationsAsync(Guid userId, string? status, CancellationToken ct = default);

    Task<IReadOnlyList<JobDto>> GetActiveJobsForStudentAsync(Guid userId, string? locationType, string? keyword, CancellationToken ct = default);
}
