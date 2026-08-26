namespace InternLinkApi.Services.AssessmentService;

public record AssessmentSessionPayload(
    Guid StudentId,
    Guid SkillId,
    string SkillName,
    long StartedAt,
    long ExpiresAt,
    List<string> QuestionIds
);

public interface IAssessmentSessionService
{
    string CreateSessionToken(Guid studentId, Guid skillId, string skillName, List<string> questionIds, int timeLimitSeconds = 600, int graceBufferSeconds = 15);
    bool TryValidateSessionToken(string token, Guid expectedStudentId, out AssessmentSessionPayload? payload, out string? errorMessage);
}
