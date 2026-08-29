using InternLinkApi.DTOs;

namespace InternLinkApi.Services.RecommendationService;

public interface IRecommendationService
{
    Task<IReadOnlyList<JobRecommendationDto>> GetRecommendedJobsAsync(Guid userId, CancellationToken ct = default);
}
