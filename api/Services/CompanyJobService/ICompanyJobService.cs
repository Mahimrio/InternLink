using InternLinkApi.DTOs;
using InternLinkApi.Models.Enums;

namespace InternLinkApi.Services.CompanyJobService;

// Lightweight internal contract used by the controller's verification gate — not a response DTO.
public record CompanyVerificationContext(Guid CompanyId, VerificationStatus Status);

public interface ICompanyJobService
{
    Task<CompanyVerificationContext?> GetVerificationContextAsync(Guid userId, CancellationToken ct = default);

    Task<PagedResultDto<CompanyJobDto>> GetCompanyJobsAsync(Guid userId, int page, int pageSize, CancellationToken ct = default);

    Task<CompanyJobDto?> GetCompanyJobByIdAsync(Guid userId, Guid jobId, CancellationToken ct = default);

    Task<IReadOnlyList<SkillOptionDto>> GetSkillOptionsAsync(CancellationToken ct = default);

    Task<CompanyJobDto> CreateJobAsync(Guid companyId, CreateJobRequestDto dto, CancellationToken ct = default);

    Task<CompanyJobDto> UpdateJobAsync(Guid companyId, Guid jobId, CreateJobRequestDto dto, CancellationToken ct = default);

    Task<CompanyJobDto> CloseJobAsync(Guid companyId, Guid jobId, CancellationToken ct = default);
}
