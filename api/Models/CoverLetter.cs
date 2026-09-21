namespace InternLinkApi.Models;

/// <summary>
/// Persisted student cover letter draft or saved submission for a specific internship posting.
/// </summary>
public class CoverLetter
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid StudentId { get; set; }
    public Guid JobId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? DocumentPath { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset LastModified { get; set; } = DateTimeOffset.UtcNow;

    public Student Student { get; set; } = null!;
    public Job Job { get; set; } = null!;
}
