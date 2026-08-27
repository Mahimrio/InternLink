using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Implementation;
using InternLinkApi.Services.CounselorAdvisingService;
using InternLinkApi.Services.JobService;
using InternLinkApi.Services.ProfileService;
using InternLinkApi.Services.ResumeService;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Tests;

public class CounselorAdvisingTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly StudentRepository _studentRepository;
    private readonly CounselorFeedbackRepository _feedbackRepository;

    public CounselorAdvisingTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"CounselorTestDb_{Guid.NewGuid()}")
            .Options;

        _db = new ApplicationDbContext(options);
        _studentRepository = new StudentRepository(_db);
        _feedbackRepository = new CounselorFeedbackRepository(_db);
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task GetCounselorStudentSummariesAsync_ReturnsCorrectSubqueryCountsAndSearchFilter()
    {
        // Arrange
        var role = new Role { Id = Guid.NewGuid(), Name = "Student", NormalizedName = "STUDENT" };
        _db.Roles.Add(role);

        var user1 = new User { Id = Guid.NewGuid(), Email = "alice@aust.edu", UserName = "alice@aust.edu", RoleId = role.Id };
        var user2 = new User { Id = Guid.NewGuid(), Email = "bob@aust.edu", UserName = "bob@aust.edu", RoleId = role.Id };
        _db.Users.AddRange(user1, user2);

        var student1 = new Student
        {
            Id = Guid.NewGuid(),
            UserId = user1.Id,
            FirstName = "Alice",
            LastName = "Smith",
            CGPA = 3.90m,
            Department = "CSE",
            InstitutionalId = "2021-1-60-001"
        };
        var student2 = new Student
        {
            Id = Guid.NewGuid(),
            UserId = user2.Id,
            FirstName = "Bob",
            LastName = "Jones",
            CGPA = 3.50m,
            Department = "EEE",
            InstitutionalId = "2021-1-60-002"
        };
        _db.Students.AddRange(student1, student2);

        // Add 2 resumes and 1 application for student1
        _db.Resumes.Add(new Resume { Id = Guid.NewGuid(), StudentId = student1.Id });
        _db.Resumes.Add(new Resume { Id = Guid.NewGuid(), StudentId = student1.Id });
        _db.Applications.Add(new Application { Id = Guid.NewGuid(), StudentId = student1.Id, JobId = Guid.NewGuid(), ApplicationStatus = ApplicationStatus.Applied });

        await _db.SaveChangesAsync();

        // Act - Search for Alice
        var aliceSummaries = await _studentRepository.GetCounselorStudentSummariesAsync("Alice", CancellationToken.None);

        // Assert
        Assert.Single(aliceSummaries);
        var alice = aliceSummaries[0];
        Assert.Equal("Alice Smith", alice.FullName);
        Assert.Equal(3.90m, alice.CGPA);
        Assert.Equal("CSE", alice.Department);
        Assert.Equal(2, alice.ResumeCount);
        Assert.Equal(1, alice.ApplicationCount);

        // Act - All students
        var allSummaries = await _studentRepository.GetCounselorStudentSummariesAsync(null, CancellationToken.None);
        Assert.Equal(2, allSummaries.Count);
    }

    [Fact]
    public async Task CreateFeedbackAsync_ValidatesLengthAndAllowsPastOrFutureDates()
    {
        // Arrange
        var role = new Role { Id = Guid.NewGuid(), Name = "Counselor", NormalizedName = "COUNSELOR" };
        var counselorUser = new User { Id = Guid.NewGuid(), Email = "counselor@aust.edu", UserName = "counselor@aust.edu", RoleId = role.Id };
        var studentUser = new User { Id = Guid.NewGuid(), Email = "student@aust.edu", UserName = "student@aust.edu", RoleId = role.Id };
        _db.Roles.Add(role);
        _db.Users.AddRange(counselorUser, studentUser);

        var student = new Student
        {
            Id = Guid.NewGuid(),
            UserId = studentUser.Id,
            FirstName = "Charlie",
            LastName = "Brown",
            CGPA = 3.75m,
            Department = "CSE",
            InstitutionalId = "2021-1-60-003"
        };
        _db.Students.Add(student);
        await _db.SaveChangesAsync();

        var service = new CounselorAdvisingService(
            _studentRepository,
            _feedbackRepository,
            new FakeProfileService(),
            new FakeResumeService(),
            new FakeJobService()
        );

        // Past meeting date
        var pastDto = new CreateCounselorFeedbackRequestDto
        {
            MeetingDate = DateTimeOffset.UtcNow.AddDays(-7),
            NarrativeMarkdown = "### Session Notes\nReviewed resume formatting."
        };
        var createdPast = await service.CreateFeedbackAsync(counselorUser.Id, student.Id, pastDto);
        Assert.NotNull(createdPast);
        Assert.Equal(pastDto.NarrativeMarkdown, createdPast.NarrativeMarkdown);

        // Future meeting date
        var futureDto = new CreateCounselorFeedbackRequestDto
        {
            MeetingDate = DateTimeOffset.UtcNow.AddDays(5),
            NarrativeMarkdown = "Scheduled roadmap session."
        };
        var createdFuture = await service.CreateFeedbackAsync(counselorUser.Id, student.Id, futureDto);
        Assert.NotNull(createdFuture);

        // Exceeds 5000 chars should throw ArgumentException
        var longDto = new CreateCounselorFeedbackRequestDto
        {
            MeetingDate = DateTimeOffset.UtcNow,
            NarrativeMarkdown = new string('A', 5001)
        };
        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.CreateFeedbackAsync(counselorUser.Id, student.Id, longDto));
    }

    [Fact]
    public async Task GetStudentFeedbackHistoryAsync_ReturnsNewestFirst()
    {
        // Arrange
        var role = new Role { Id = Guid.NewGuid(), Name = "Counselor", NormalizedName = "COUNSELOR" };
        var counselorUser = new User { Id = Guid.NewGuid(), Email = "counselor@aust.edu", UserName = "counselor@aust.edu", RoleId = role.Id };
        var studentUser = new User { Id = Guid.NewGuid(), Email = "student@aust.edu", UserName = "student@aust.edu", RoleId = role.Id };
        _db.Roles.Add(role);
        _db.Users.AddRange(counselorUser, studentUser);

        var student = new Student
        {
            Id = Guid.NewGuid(),
            UserId = studentUser.Id,
            FirstName = "Dana",
            LastName = "Scully",
            CGPA = 3.95m,
            Department = "CSE",
            InstitutionalId = "2021-1-60-004"
        };
        _db.Students.Add(student);

        var olderFeedback = new CounselorFeedback
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            CounselorUserId = counselorUser.Id,
            MeetingDate = DateTimeOffset.UtcNow.AddDays(-10),
            NarrativeMarkdown = "Older meeting"
        };
        var newerFeedback = new CounselorFeedback
        {
            Id = Guid.NewGuid(),
            StudentId = student.Id,
            CounselorUserId = counselorUser.Id,
            MeetingDate = DateTimeOffset.UtcNow.AddDays(-1),
            NarrativeMarkdown = "Newer meeting"
        };
        _db.CounselorFeedbacks.AddRange(olderFeedback, newerFeedback);
        await _db.SaveChangesAsync();

        var service = new CounselorAdvisingService(
            _studentRepository,
            _feedbackRepository,
            new FakeProfileService(),
            new FakeResumeService(),
            new FakeJobService()
        );

        // Act
        var history = await service.GetStudentFeedbackHistoryAsync(student.Id);

        // Assert
        Assert.Equal(2, history.Count);
        Assert.Equal("Newer meeting", history[0].NarrativeMarkdown);
        Assert.Equal("Older meeting", history[1].NarrativeMarkdown);

        // Act - student own feedback
        var studentOwn = await service.GetStudentOwnFeedbackAsync(studentUser.Id);
        Assert.Equal(2, studentOwn.Count);
        Assert.Equal("Newer meeting", studentOwn[0].NarrativeMarkdown);
    }

    private class FakeProfileService : IProfileService
    {
        public Task<ProfileDto?> GetProfileAsync(Guid userId, CancellationToken ct = default) =>
            Task.FromResult<ProfileDto?>(new ProfileDto("Test", "User", 3.80m, "123", "CSE", "Bio", "AI", Array.Empty<string>()));

        public Task<ProfileDto> UpdateProfileAsync(Guid userId, UpdateProfileRequestDto dto, CancellationToken ct = default) =>
            throw new NotImplementedException();
    }

    private class FakeResumeService : IResumeService
    {
        public Task<CreateResumeResponseDto> CreateResumeAsync(Guid userId, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<ResumeDto> UpdateResumeStepAsync(Guid userId, Guid resumeId, string stepName, System.Text.Json.JsonElement stepData, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<FinalizeResumeResponseDto> FinalizeResumeAsync(Guid userId, Guid resumeId, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<IReadOnlyList<ResumeDto>> GetResumesAsync(Guid userId, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<ResumeDto>>(new List<ResumeDto>());
    }

    private class FakeJobService : IJobService
    {
        public Task<PagedResultDto<JobDto>> GetPagedJobsForStudentAsync(Guid userId, string? locationType, string? keyword, bool? relevantToMe, int page, int pageSize, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<JobDto?> GetJobDetailsForStudentAsync(Guid userId, Guid jobId, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<ApplicationDto> ApplyToJobAsync(Guid userId, Guid jobId, Guid resumeId, CancellationToken ct = default) => throw new NotImplementedException();
        public Task<IReadOnlyList<ApplicationDto>> GetStudentApplicationsAsync(Guid userId, string? status, CancellationToken ct = default) =>
            Task.FromResult<IReadOnlyList<ApplicationDto>>(new List<ApplicationDto>());
        public Task<IReadOnlyList<JobDto>> GetActiveJobsForStudentAsync(Guid userId, string? locationType, string? keyword, CancellationToken ct = default) => throw new NotImplementedException();
    }
}
