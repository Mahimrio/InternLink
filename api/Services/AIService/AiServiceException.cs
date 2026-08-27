namespace InternLinkApi.Services.AIService;

public class AiServiceException : Exception
{
    public string UserFacingMessage { get; }

    public AiServiceException(string userFacingMessage, Exception innerException) 
        : base(userFacingMessage, innerException)
    {
        UserFacingMessage = userFacingMessage;
    }
}
