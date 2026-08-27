using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.StudentSkillService;

public class StudentSkillService : IStudentSkillService
{
    // A skill is "verified" once its assessment score reaches this threshold.
    public const int VerifiedScoreThreshold = 70;

    private readonly IAssessmentRepository _assessmentRepository;

    public StudentSkillService(IAssessmentRepository assessmentRepository)
    {
        _assessmentRepository = assessmentRepository;
    }

    public Task<IReadOnlyList<string>> GetVerifiedSkillNamesAsync(Guid studentId, CancellationToken ct = default) =>
        _assessmentRepository.GetVerifiedSkillNamesAsync(studentId, VerifiedScoreThreshold, ct);

    public Task<IReadOnlyDictionary<Guid, int>> GetVerifiedSkillCountsAsync(
        IReadOnlyCollection<Guid> studentIds, CancellationToken ct = default) =>
        _assessmentRepository.GetVerifiedSkillCountsAsync(studentIds, VerifiedScoreThreshold, ct);
}
