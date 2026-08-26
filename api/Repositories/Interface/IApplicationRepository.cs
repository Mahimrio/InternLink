using InternLinkApi.Models;
using InternLinkApi.Models.Enums;

namespace InternLinkApi.Repositories.Interface;

public interface IApplicationRepository : IRepository<Application>
{
    Task<IReadOnlyList<Application>> GetByStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<Application>> GetByStatusAsync(Guid companyId, ApplicationStatus? status, CancellationToken ct = default);
    Task<HashSet<Guid>> GetAppliedJobIdsForStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<bool> ExistsAsync(Guid jobId, Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<Application>> GetStudentApplicationsWithDetailsAsync(Guid studentId, ApplicationStatus? status, CancellationToken ct = default);

    // ATS (company) side. Ownership is enforced via Job.CompanyId, never a raw jobId param.
    Task<(IReadOnlyList<Application> Items, int TotalCount)> GetCompanyApplicationsAsync(
        Guid companyId, Guid? jobId, ApplicationStatus? status, int page, int pageSize, CancellationToken ct = default);

    Task<Application?> GetCompanyApplicationDetailAsync(Guid companyId, Guid applicationId, CancellationToken ct = default);

    // Tracked, company-scoped load (with Job + Student) for a status update.
    Task<Application?> GetTrackedCompanyApplicationAsync(Guid companyId, Guid applicationId, CancellationToken ct = default);
}
