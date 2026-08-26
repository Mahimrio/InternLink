using InternLinkApi.DTOs;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.AdminService;

public class AdminAnalyticsService : IAdminAnalyticsService
{
    private const int TrendDays = 7;

    private readonly IAdminAnalyticsRepository _analyticsRepo;

    public AdminAnalyticsService(IAdminAnalyticsRepository analyticsRepo)
    {
        _analyticsRepo = analyticsRepo;
    }

    public async Task<AdminAnalyticsDto> GetAnalyticsAsync(CancellationToken ct = default)
    {
        var activeStudents = await _analyticsRepo.GetActiveStudentCountAsync(ct);
        var activeCompanies = await _analyticsRepo.GetActiveCompanyCountAsync(ct);
        var openJobs = await _analyticsRepo.GetOpenJobCountAsync(ct);
        var byStatus = await _analyticsRepo.GetApplicationsByStatusAsync(ct);

        var startDate = DateTime.UtcNow.Date.AddDays(-(TrendDays - 1));
        var since = new DateTimeOffset(startDate, TimeSpan.Zero);
        var submissions = await _analyticsRepo.GetSubmissionsSinceAsync(since, ct);

        var countsByDay = submissions
            .GroupBy(t => t.UtcDateTime.Date)
            .ToDictionary(g => g.Key, g => g.Count());

        var trend = Enumerable.Range(0, TrendDays)
            .Select(offset =>
            {
                var day = startDate.AddDays(offset);
                return new DailyCountDto
                {
                    Date = day.ToString("yyyy-MM-dd"),
                    Count = countsByDay.TryGetValue(day, out var c) ? c : 0,
                };
            })
            .ToList();

        return new AdminAnalyticsDto
        {
            ActiveStudentCount = activeStudents,
            ActiveCompanyCount = activeCompanies,
            OpenJobCount = openJobs,
            ApplicationsByStatus = new ApplicationsByStatusDto
            {
                Applied = byStatus.GetValueOrDefault(ApplicationStatus.Applied),
                Screened = byStatus.GetValueOrDefault(ApplicationStatus.Screened),
                Scheduled = byStatus.GetValueOrDefault(ApplicationStatus.Scheduled),
                Offered = byStatus.GetValueOrDefault(ApplicationStatus.Offered),
                Rejected = byStatus.GetValueOrDefault(ApplicationStatus.Rejected),
            },
            NewApplicationsLast7Days = trend,
        };
    }
}
