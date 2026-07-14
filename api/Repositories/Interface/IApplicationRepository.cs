using InternLinkApi.Models;
using InternLinkApi.Models.Enums;

namespace InternLinkApi.Repositories.Interface;

public interface IApplicationRepository : IRepository<Application>
{
    Task<IReadOnlyList<Application>> GetByStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<Application>> GetByStatusAsync(Guid companyId, ApplicationStatus? status, CancellationToken ct = default);
}
