namespace InternLinkApi.DTOs;

// ── Question bank ───────────────────────────────────────────────────
public record GenerateInterviewQuestionsRequestDto(string Role, Guid? JobId);
public record InterviewQuestionItemDto(string QuestionText, string Category);
public record GenerateInterviewQuestionsResponseDto(List<InterviewQuestionItemDto> Questions);

// ── Mock interview session lifecycle ────────────────────────────────
public record StartMockInterviewSessionRequestDto(string Role, Guid? JobId);
public record StartMockInterviewSessionResponseDto(Guid SessionId, string FirstQuestion, string Role);

public record SendInterviewMessageRequestDto(string StudentReply);
public record SendInterviewMessageResponseDto(string AiReply, bool IsCompleted);

// ── Coaching report ────────────────────────────────────────────────
public record InterviewReportDto(
    string AccuracySummary,
    List<string> LogicGaps,
    List<string> ImprovementSuggestions);

// ── Session detail (transcript view / history) ─────────────────────
public record ChatMessageDto(string Role, string Content, DateTimeOffset Timestamp);

public record MockInterviewSessionDetailDto(
    Guid SessionId,
    string Role,
    Guid? JobId,
    string Status,
    List<ChatMessageDto> Messages,
    InterviewReportDto? Report,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt);
