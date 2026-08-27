namespace InternLinkApi.DTOs;

public class AdminAnalyticsDto
{
    public int ActiveStudentCount { get; set; }
    public int ActiveCompanyCount { get; set; }
    public int OpenJobCount { get; set; }
    public ApplicationsByStatusDto ApplicationsByStatus { get; set; } = new();
    public List<DailyCountDto> NewApplicationsLast7Days { get; set; } = [];
}

public class ApplicationsByStatusDto
{
    public int Applied { get; set; }
    public int Screened { get; set; }
    public int Scheduled { get; set; }
    public int Offered { get; set; }
    public int Rejected { get; set; }
}

public class DailyCountDto
{
    public string Date { get; set; } = string.Empty;
    public int Count { get; set; }
}
