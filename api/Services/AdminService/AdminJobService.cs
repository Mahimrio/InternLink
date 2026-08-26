using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.Extensions.Logging;

namespace InternLinkApi.Services.AdminService;

public class AdminJobService : IAdminJobService
{
    private readonly IJobRepository _jobRepo;
    private readonly ILogger<AdminJobService> _logger;

    public AdminJobService(IJobRepository jobRepo, ILogger<AdminJobService> logger)
    {
        _jobRepo = jobRepo;
        _logger = logger;
    }

    public async Task<PagedResultDto<AdminJobDto>> GetJobsAsync(bool approved, int page, int pageSize, CancellationToken ct = default)
    {
        var (jobs, totalCount) = await _jobRepo.GetPagedByApprovalAsync(approved, page, pageSize, ct);
        var items = jobs.Select(ToDto).ToList();
        return new PagedResultDto<AdminJobDto>(items, totalCount, page, pageSize);
    }

    public async Task ApproveAsync(Guid adminId, Guid jobId, CancellationToken ct = default)
    {
        var job = await _jobRepo.GetByIdAsync(jobId, ct)
            ?? throw new KeyNotFoundException("Job not found.");

        job.IsApproved = true;
        await _jobRepo.SaveChangesAsync(ct);

        _logger.LogInformation(
            "Admin {AdminId} performed {Action} on {TargetType}:{TargetId} at {Timestamp}",
            adminId, "ApproveJob", "Job", jobId, DateTimeOffset.UtcNow);
    }

    private static AdminJobDto ToDto(Job job) =>
        new()
        {
            Id = job.Id,
            Title = job.Title,
            CompanyName = job.Company?.CompanyName ?? string.Empty,
            Description = job.CoreDescription,
            LocationType = job.LocationType.ToString(),
            DeadLine = job.DeadLine,
            IsApproved = job.IsApproved,
            IsClosed = job.IsClosed,
        };
}
