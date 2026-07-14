using InternLinkApi.Models.Enums;

namespace InternLinkApi.Models;

public class Job
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string CoreDescription { get; set; } = string.Empty;
    public string SelectionCriteria { get; set; } = string.Empty;
    public LocationType LocationType { get; set; }
    public DateTimeOffset DeadLine { get; set; }
    public bool IsApproved { get; set; } = false;
    public bool IsClosed { get; set; } = false;

    public Company Company { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = [];
    public ICollection<JobSkill> JobSkills { get; set; } = [];
}
