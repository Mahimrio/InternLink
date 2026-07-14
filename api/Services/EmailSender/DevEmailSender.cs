using Microsoft.Extensions.Logging;

namespace InternLinkApi.Services.EmailSender;

public class DevEmailSender : IEmailSender
{
    private readonly ILogger<DevEmailSender> _logger;

    public DevEmailSender(ILogger<DevEmailSender> logger)
    {
        _logger = logger;
    }

    public Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        _logger.LogInformation("[DEV OTP] To: {Email} | Subject: {Subject} | Body: {Body}", toEmail, subject, htmlBody);
        Console.WriteLine($"========== [DEV OTP] ==========");
        Console.WriteLine($"To: {toEmail}");
        Console.WriteLine($"Subject: {subject}");
        Console.WriteLine($"Body: {htmlBody}");
        Console.WriteLine($"================================");
        return Task.CompletedTask;
    }
}
