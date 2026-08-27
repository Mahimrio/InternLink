using InternLinkApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Data;

public class ApplicationDbContext : IdentityDbContext<User, Role, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Student> Students => Set<Student>();
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<Application> Applications => Set<Application>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<Resume> Resumes => Set<Resume>();
    public DbSet<Skill> Skills => Set<Skill>();
    public DbSet<StudentSkill> StudentSkills => Set<StudentSkill>();
    public DbSet<JobSkill> JobSkills => Set<JobSkill>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<CounselorFeedback> CounselorFeedbacks => Set<CounselorFeedback>();
    public DbSet<AIHistory> AIHistories => Set<AIHistory>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OtpCode> OtpCodes => Set<OtpCode>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ----- Table naming -----
        builder.Entity<User>().ToTable("Users");
        builder.Entity<Role>().ToTable("Roles");
        builder.Entity<Student>().ToTable("Students");
        builder.Entity<Company>().ToTable("Companies");
        builder.Entity<Job>().ToTable("Jobs");
        builder.Entity<Application>().ToTable("Applications");
        builder.Entity<Interview>().ToTable("Interviews");
        builder.Entity<Resume>().ToTable("Resumes");
        builder.Entity<Skill>().ToTable("Skills");
        builder.Entity<StudentSkill>().ToTable("StudentSkills");
        builder.Entity<JobSkill>().ToTable("JobSkills");
        builder.Entity<Notification>().ToTable("Notifications");
        builder.Entity<Assessment>().ToTable("Assessments");
        builder.Entity<CounselorFeedback>().ToTable("CounselorFeedback");
        builder.Entity<AIHistory>().ToTable("AIHistory");

        // ----- User / Role -----
        builder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId)
            .OnDelete(DeleteBehavior.Restrict);

        // ----- Student 1:1 User -----
        builder.Entity<Student>()
            .HasOne(s => s.User)
            .WithOne(u => u.Student)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- Company 1:1 User -----
        builder.Entity<Company>()
            .HasOne(c => c.User)
            .WithOne(u => u.Company)
            .HasForeignKey<Company>(c => c.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- Company -> Jobs (Cascade) -----
        builder.Entity<Job>()
            .HasOne(j => j.Company)
            .WithMany(c => c.Jobs)
            .HasForeignKey(j => j.CompanyId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- Students -> Applications (Cascade) -----
        builder.Entity<Application>()
            .HasOne(a => a.Student)
            .WithMany(s => s.Applications)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- Students -> Resumes (Cascade) -----
        builder.Entity<Resume>()
            .HasOne(r => r.Student)
            .WithMany(s => s.Resumes)
            .HasForeignKey(r => r.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- Students -> Assessments (Cascade) -----
        builder.Entity<Assessment>()
            .HasOne(a => a.Student)
            .WithMany(s => s.Assessments)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- Students -> CounselorFeedback (Cascade) -----
        builder.Entity<CounselorFeedback>()
            .HasOne(cf => cf.Student)
            .WithMany(s => s.CounselorFeedbacks)
            .HasForeignKey(cf => cf.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- CounselorUser -> CounselorFeedback (Restrict) -----
        builder.Entity<CounselorFeedback>()
            .HasOne(cf => cf.CounselorUser)
            .WithMany(u => u.CounselorFeedbacks)
            .HasForeignKey(cf => cf.CounselorUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ----- Jobs -> Applications (Restrict — see comment below) -----
        // A hard-deleted Job would otherwise cascade-delete every Application to it,
        // destroying a student's application history for something that isn't their fault.
        // Jobs get "closed" via the IsClosed flag, never actually deleted, so this
        // Restrict is a safety net against a future mistake.
        builder.Entity<Application>()
            .HasOne(a => a.Job)
            .WithMany(j => j.Applications)
            .HasForeignKey(a => a.JobId)
            .OnDelete(DeleteBehavior.Restrict);

        // ----- Applications -> Interviews (Cascade) -----
        builder.Entity<Interview>()
            .HasOne(i => i.Application)
            .WithMany(a => a.Interviews)
            .HasForeignKey(i => i.ApplicationId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- Applications -> AttachedResume (optional, Restrict) -----
        builder.Entity<Application>()
            .HasOne(a => a.AttachedResume)
            .WithMany(r => r.Applications)
            .HasForeignKey(a => a.AttachedResumeId)
            .OnDelete(DeleteBehavior.Restrict);

        // ----- User -> Notifications -----
        builder.Entity<Notification>()
            .HasOne(n => n.TargetUser)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.TargetUserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- User -> AIHistory -----
        builder.Entity<AIHistory>()
            .HasOne(ah => ah.User)
            .WithMany(u => u.AIHistories)
            .HasForeignKey(ah => ah.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // ----- Skill -> Assessments -----
        builder.Entity<Assessment>()
            .HasOne(a => a.Skill)
            .WithMany(s => s.Assessments)
            .HasForeignKey(a => a.SkillId)
            .OnDelete(DeleteBehavior.Restrict);

        // ----- StudentSkill: composite key -----
        builder.Entity<StudentSkill>()
            .HasKey(ss => new { ss.StudentId, ss.SkillId });

        builder.Entity<StudentSkill>()
            .HasOne(ss => ss.Student)
            .WithMany(s => s.StudentSkills)
            .HasForeignKey(ss => ss.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<StudentSkill>()
            .HasOne(ss => ss.Skill)
            .WithMany(s => s.StudentSkills)
            .HasForeignKey(ss => ss.SkillId)
            .OnDelete(DeleteBehavior.Restrict);

        // ----- JobSkill: composite key -----
        builder.Entity<JobSkill>()
            .HasKey(js => new { js.JobId, js.SkillId });

        builder.Entity<JobSkill>()
            .HasOne(js => js.Job)
            .WithMany(j => j.JobSkills)
            .HasForeignKey(js => js.JobId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<JobSkill>()
            .HasOne(js => js.Skill)
            .WithMany(s => s.JobSkills)
            .HasForeignKey(js => js.SkillId)
            .OnDelete(DeleteBehavior.Restrict);

        // ----- User -> RefreshTokens -----
        builder.Entity<RefreshToken>()
            .ToTable("RefreshTokens")
            .HasKey(rt => rt.Id);

        builder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany()
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RefreshToken>()
            .HasOne(rt => rt.ReplacedByToken)
            .WithMany()
            .HasForeignKey(rt => rt.ReplacedByTokenId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<RefreshToken>()
            .HasIndex(rt => rt.UserId);

        // ----- User -> OtpCodes -----
        builder.Entity<OtpCode>()
            .ToTable("OtpCodes")
            .HasKey(oc => oc.Id);

        builder.Entity<OtpCode>()
            .HasOne(oc => oc.User)
            .WithMany()
            .HasForeignKey(oc => oc.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<OtpCode>()
            .HasIndex(oc => new { oc.UserId, oc.CreatedAt });

        // ----- JSON column -----
        builder.Entity<Resume>()
            .Property(r => r.DynamicJsonData)
            .HasColumnType("jsonb");

        // ----- Decimal precision -----
        builder.Entity<Student>()
            .Property(s => s.CGPA)
            .HasPrecision(3, 2);

        builder.Entity<AIHistory>()
            .Property(ah => ah.TokenCost)
            .HasPrecision(10, 4);

        // ----- Indexes -----
        builder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        builder.Entity<Student>()
            .HasIndex(s => s.InstitutionalId)
            .IsUnique();

        builder.Entity<Job>()
            .HasIndex(j => j.IsApproved);

        builder.Entity<Job>()
            .HasIndex(j => new { j.IsApproved, j.IsClosed });

        builder.Entity<Application>()
            .HasIndex(a => a.ApplicationStatus);

        builder.Entity<Application>()
            .HasIndex(a => new { a.JobId, a.StudentId })
            .IsUnique();
    }
}
