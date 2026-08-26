using System.Text.Json;
using InternLinkApi.DTOs;

namespace InternLinkApi.Services.ResumeService;

public interface IResumeService
{
    Task<CreateResumeResponseDto> CreateResumeAsync(Guid userId, CancellationToken ct = default);
    Task<ResumeDto> UpdateResumeStepAsync(Guid userId, Guid resumeId, string stepName, JsonElement stepData, CancellationToken ct = default);
    Task<FinalizeResumeResponseDto> FinalizeResumeAsync(Guid userId, Guid resumeId, CancellationToken ct = default);
    Task<IReadOnlyList<ResumeDto>> GetResumesAsync(Guid userId, CancellationToken ct = default);
}
