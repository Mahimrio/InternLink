using System;
using System.Threading;
using System.Threading.Tasks;
using InternLinkApi.Models.Enums;
using InternLinkApi.Services.AIService;
using Xunit;

namespace InternLinkApi.Tests.AIService;

public class AIServiceTests
{
    // A trivial dummy caller service that relies on ILlmClient
    public class DummyFeatureService
    {
        private readonly ILlmClient _llmClient;

        public DummyFeatureService(ILlmClient llmClient)
        {
            _llmClient = llmClient;
        }

        public async Task<string> GenerateRecommendationAsync(Guid userId, CancellationToken ct = default)
        {
            try
            {
                var response = await _llmClient.CompletePromptAsync(
                    "You are a helpful assistant.",
                    "Give me a recommendation.",
                    IntegrationFeature.JobMatching,
                    userId,
                    ct
                );

                return response.Content;
            }
            catch (AiServiceException)
            {
                // Graceful fallback instead of unhandled crash
                return "AI recommendation is currently unavailable. Please try again later.";
            }
        }
    }

    // A manual mock since no mocking library is installed yet
    public class MockLlmClient : ILlmClient
    {
        public bool ShouldThrow { get; set; }
        public bool WasCalled { get; private set; }

        public Task<LlmResponse> CompletePromptAsync(string systemPrompt, string userPrompt, IntegrationFeature feature, Guid userId, CancellationToken ct = default)
        {
            WasCalled = true;

            if (ShouldThrow)
            {
                throw new AiServiceException("The AI provider is temporarily unavailable. Please try again later.", new Exception("Simulated transient error"));
            }

            return Task.FromResult(new LlmResponse
            {
                Content = "Mocked successful recommendation",
                PromptTokens = 10,
                CompletionTokens = 20,
                EstimatedCostUsd = 0.0001m
            });
        }
    }

    [Fact]
    public async Task DummyFeatureService_Success_ReturnsAiContent()
    {
        // Arrange
        var mockClient = new MockLlmClient { ShouldThrow = false };
        var service = new DummyFeatureService(mockClient);

        // Act
        var result = await service.GenerateRecommendationAsync(Guid.NewGuid());

        // Assert
        Assert.True(mockClient.WasCalled);
        Assert.Equal("Mocked successful recommendation", result);
    }

    [Fact]
    public async Task DummyFeatureService_AiServiceException_ReturnsGracefulFallback()
    {
        // Arrange
        var mockClient = new MockLlmClient { ShouldThrow = true };
        var service = new DummyFeatureService(mockClient);

        // Act
        var result = await service.GenerateRecommendationAsync(Guid.NewGuid());

        // Assert
        Assert.True(mockClient.WasCalled);
        Assert.Equal("AI recommendation is currently unavailable. Please try again later.", result);
    }
}
