using InternLinkApi.DTOs;
using InternLinkApi.Services.InterviewPrepService;
using Microsoft.AspNetCore.Mvc;

namespace InternLinkApi.Controllers.Student;

[Route("api/student/interview-prep")]
public class InterviewPrepController : StudentApiControllerBase
{
    private readonly IInterviewPrepService _interviewPrepService;

    public InterviewPrepController(IInterviewPrepService interviewPrepService)
    {
        _interviewPrepService = interviewPrepService;
    }

    /// <summary>Generate a bank of adaptive interview questions for a role.</summary>
    [HttpPost("questions")]
    public async Task<IActionResult> GenerateQuestions(
        [FromBody] GenerateInterviewQuestionsRequestDto dto,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Role))
            return BadRequest(new { error = "Role is required." });

        try
        {
            var result = await _interviewPrepService.GenerateQuestionsAsync(
                CurrentUserId, dto.Role, dto.JobId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>Start a new mock interview session.</summary>
    [HttpPost("sessions")]
    public async Task<IActionResult> StartSession(
        [FromBody] StartMockInterviewSessionRequestDto dto,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.Role))
            return BadRequest(new { error = "Role is required." });

        try
        {
            var result = await _interviewPrepService.StartSessionAsync(
                CurrentUserId, dto.Role, dto.JobId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>Retrieve an existing session's transcript and status.</summary>
    [HttpGet("sessions/{sessionId:guid}")]
    public async Task<IActionResult> GetSession(Guid sessionId, CancellationToken ct = default)
    {
        try
        {
            var result = await _interviewPrepService.GetSessionAsync(
                CurrentUserId, sessionId, ct);

            if (result is null)
                return NotFound(new { error = "Interview session not found." });

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }

    /// <summary>Submit a candidate reply and receive the interviewer's next response.</summary>
    [HttpPost("sessions/{sessionId:guid}/message")]
    public async Task<IActionResult> SendMessage(
        Guid sessionId,
        [FromBody] SendInterviewMessageRequestDto dto,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(dto.StudentReply))
            return BadRequest(new { error = "Reply cannot be empty." });

        try
        {
            var result = await _interviewPrepService.SendMessageAsync(
                CurrentUserId, sessionId, dto.StudentReply, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    /// <summary>End the interview session and generate the coaching report.</summary>
    [HttpPost("sessions/{sessionId:guid}/end")]
    public async Task<IActionResult> EndSession(
        Guid sessionId,
        CancellationToken ct = default)
    {
        try
        {
            var result = await _interviewPrepService.EndSessionAsync(
                CurrentUserId, sessionId, ct);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}
