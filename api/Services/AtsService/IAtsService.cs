using InternLinkApi.DTOs;

namespace InternLinkApi.Services.AtsService;

public interface IAtsService
{
    Task<PagedResultDto<AtsApplicationListItemDto>> GetApplicationsAsync(
        Guid userId, Guid? jobId, string? status, int page, int pageSize, CancellationToken ct = default);

    Task<AtsApplicantDetailDto?> GetApplicationDetailAsync(Guid userId, Guid applicationId, CancellationToken ct = default);

    Task<AtsApplicationListItemDto> UpdateStatusAsync(
        Guid userId, Guid applicationId, UpdateApplicationStatusRequestDto dto, CancellationToken ct = default);
}
