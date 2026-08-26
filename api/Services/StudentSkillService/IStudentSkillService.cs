namespace InternLinkApi.Services.StudentSkillService;

// Single source of truth for "verified skills" — a skill counts as verified once the
// student's assessment score reaches the threshold. Both the student-side badge display
// (Prompt 21) and the company ATS applicant detail should call this, never re-derive it.
public interface IStudentSkillService
{
    Task<IReadOnlyList<string>> GetVerifiedSkillNamesAsync(Guid studentId, CancellationToken ct = default);

    Task<IReadOnlyDictionary<Guid, int>> GetVerifiedSkillCountsAsync(
        IReadOnlyCollection<Guid> studentIds, CancellationToken ct = default);
}
