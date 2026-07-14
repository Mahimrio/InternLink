namespace InternLinkApi.Models;

public class Resume
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public string DocumentPath { get; set; } = string.Empty;

    /// <summary>Flexible resume data stored as JSONB. Schema varies by provider/parser.</summary>
    public string DynamicJsonData { get; set; } = "{}";
    public DateTimeOffset LastModified { get; set; } = DateTimeOffset.UtcNow;

    public Student Student { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = [];
}
