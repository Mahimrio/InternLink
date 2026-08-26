using InternLinkApi.Models.Enums;

namespace InternLinkApi.Repositories.Interface;

public interface IAdminAnalyticsRepository
{
    Task<int> GetActiveStudentCountAsync(CancellationToken ct = default);
    Task<int> GetActiveCompanyCountAsync(CancellationToken ct = default);
    Task<int> GetOpenJobCountAsync(CancellationToken ct = default);
    Task<IReadOnlyDictionary<ApplicationStatus, int>> GetApplicationsByStatusAsync(CancellationToken ct = default);

    // Raw submission timestamps in one query; the 7-day series is assembled in the service.
    Task<IReadOnlyList<DateTimeOffset>> GetSubmissionsSinceAsync(DateTimeOffset since, CancellationToken ct = default);
}
