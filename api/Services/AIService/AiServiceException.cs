namespace InternLinkApi.Services.AIService;

/// <summary>
/// Thrown when the AI provider fails after retries or returns an unusable response.
/// UserFacingMessage is safe to surface to clients; the inner exception carries provider detail for logs.
/// </summary>
public class AiServiceException : Exception
{
    public string UserFacingMessage { get; }

    public AiServiceException(string userFacingMessage, Exception? inner = null)
        : base(userFacingMessage, inner)
    {
        UserFacingMessage = userFacingMessage;
    }
}
