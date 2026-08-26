using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface IAssessmentRepository : IRepository<Assessment>
{
    // Distinct names of skills the student has "verified" by scoring at/above the threshold.
    Task<IReadOnlyList<string>> GetVerifiedSkillNamesAsync(Guid studentId, int minScore, CancellationToken ct = default);

    // Distinct verified-skill count per student, for a batch of students (avoids N+1).
    Task<IReadOnlyDictionary<Guid, int>> GetVerifiedSkillCountsAsync(
        IReadOnlyCollection<Guid> studentIds, int minScore, CancellationToken ct = default);
}
