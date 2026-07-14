namespace InternLinkApi.Models;

public class Student
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public decimal CGPA { get; set; }
    public string InstitutionalId { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string? Biography { get; set; }
    public string? Interests { get; set; }

    public User User { get; set; } = null!;
    public ICollection<Application> Applications { get; set; } = [];
    public ICollection<Resume> Resumes { get; set; } = [];
    public ICollection<Assessment> Assessments { get; set; } = [];
    public ICollection<StudentSkill> StudentSkills { get; set; } = [];
    public ICollection<CounselorFeedback> CounselorFeedbacks { get; set; } = [];
}
