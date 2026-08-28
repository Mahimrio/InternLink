using InternLinkApi.Models.Enums;
using InternLinkApi.Services.AIService;
using NSubstitute;
using NSubstitute.ExceptionExtensions;

namespace InternLinkApi.Tests;

/// <summary>
/// Trivial caller standing in for the Prompt 30-34 feature services: it must
/// degrade to a fallback message when the AI gateway fails, never crash.
/// </summary>
internal class ResumeTipsCaller
{
    public const string FallbackMessage = "AI suggestions are unavailable right now — please try again later.";

    private readonly ILlmClient _llm;

    public ResumeTipsCaller(ILlmClient llm) => _llm = llm;

    public async Task<string> GetTipsAsync(Guid userId, string resumeText, CancellationToken ct = default)
    {
        try
        {
            var response = await _llm.CompletePromptAsync(
                "You are a resume coach.", resumeText, IntegrationFeature.ResumeSuggestions, userId, ct);
            return response.Content;
        }
        catch (AiServiceException)
        {
            return FallbackMessage;
        }
    }
}

public class AiGatewayTests
{
    [Fact]
    public async Task Caller_returns_graceful_fallback_when_gateway_throws_AiServiceException()
    {
        var llm = Substitute.For<ILlmClient>();
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), Arg.Any<IntegrationFeature>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .ThrowsAsync(new AiServiceException("The AI service is currently unavailable. Please try again later."));

        var caller = new ResumeTipsCaller(llm);

        var result = await caller.GetTipsAsync(Guid.NewGuid(), "My resume text");

        Assert.Equal(ResumeTipsCaller.FallbackMessage, result);
    }

    [Fact]
    public async Task Caller_returns_content_on_successful_completion()
    {
        var llm = Substitute.For<ILlmClient>();
        llm.CompletePromptAsync(
                Arg.Any<string>(), Arg.Any<string>(), Arg.Any<IntegrationFeature>(), Arg.Any<Guid>(), Arg.Any<CancellationToken>())
            .Returns(new LlmResponse("Add measurable achievements.", 120, 45, 0.00003m));

        var caller = new ResumeTipsCaller(llm);

        var result = await caller.GetTipsAsync(Guid.NewGuid(), "My resume text");

        Assert.Equal("Add measurable achievements.", result);
    }

    [Fact]
    public void Token_cost_is_computed_from_published_per_token_pricing()
    {
        // 1M input tokens at $0.75 + 1M output tokens at $3.75 = $4.50
        Assert.Equal(4.50m, GeminiClient.ComputeCostUsd(1_000_000, 1_000_000));

        // Zero usage costs nothing
        Assert.Equal(0m, GeminiClient.ComputeCostUsd(0, 0));

        // Typical small call: 1200 prompt + 400 completion tokens
        Assert.Equal(0.0024m, GeminiClient.ComputeCostUsd(1200, 400));
    }
}
