using InternLinkApi.DTOs;

namespace InternLinkApi.Services.InterviewPrepService;

public interface IInterviewPrepService
{
    Task<GenerateInterviewQuestionsResponseDto> GenerateQuestionsAsync(
        Guid userId, string role, Guid? jobId, CancellationToken ct = default);

    Task<StartMockInterviewSessionResponseDto> StartSessionAsync(
        Guid userId, string role, Guid? jobId, CancellationToken ct = default);

    Task<SendInterviewMessageResponseDto> SendMessageAsync(
        Guid userId, Guid sessionId, string studentReply, CancellationToken ct = default);

    Task<InterviewReportDto> EndSessionAsync(
        Guid userId, Guid sessionId, CancellationToken ct = default);

    Task<MockInterviewSessionDetailDto?> GetSessionAsync(
        Guid userId, Guid sessionId, CancellationToken ct = default);
}
