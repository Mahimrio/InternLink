using InternLinkApi.Models;

namespace InternLinkApi.Repositories.Interface;

public interface IAssessmentRepository
{
    Task<IReadOnlyList<Assessment>> GetByStudentIdAsync(Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<Assessment>> GetByStudentAndSkillAsync(Guid studentId, Guid skillId, CancellationToken ct = default);
    Task<Dictionary<Guid, int>> GetBestScoresForStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<HashSet<Guid>> GetVerifiedSkillIdsForStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<string>> GetVerifiedSkillNamesForStudentAsync(Guid studentId, CancellationToken ct = default);
    Task<IReadOnlyList<Skill>> GetAllSkillsAsync(CancellationToken ct = default);
    Task<Skill?> GetSkillByIdAsync(Guid skillId, CancellationToken ct = default);
    Task<Skill?> GetSkillByNameAsync(string skillName, CancellationToken ct = default);
    Task AddAssessmentAsync(Assessment assessment, CancellationToken ct = default);
    Task EnsureStudentSkillLinkedAsync(Guid studentId, Guid skillId, int proficiency, CancellationToken ct = default);
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}
