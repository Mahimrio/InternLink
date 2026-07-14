using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InternLinkApi.Services.EmailSender;

public class SmtpEmailSender : IEmailSender
{
    private readonly SmtpOptions _options;
    private readonly ILogger<SmtpEmailSender> _logger;

    public SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger)
    {
        _options = new SmtpOptions
        {
            Host = configuration["Smtp:Host"] ?? throw new InvalidOperationException("Smtp:Host is not configured."),
            Port = int.Parse(configuration["Smtp:Port"] ?? "587"),
            User = configuration["Smtp:User"] ?? throw new InvalidOperationException("Smtp:User is not configured."),
            Pass = configuration["Smtp:Pass"] ?? throw new InvalidOperationException("Smtp:Pass is not configured."),
            FromAddress = configuration["Smtp:FromAddress"] ?? throw new InvalidOperationException("Smtp:FromAddress is not configured."),
        };
        _logger = logger;
    }

    public async Task SendAsync(string toEmail, string subject, string htmlBody, CancellationToken ct = default)
    {
        using var client = new SmtpClient(_options.Host, _options.Port)
        {
            Credentials = new NetworkCredential(_options.User, _options.Pass),
            EnableSsl = true,
        };

        var message = new MailMessage
        {
            From = new MailAddress(_options.FromAddress),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true,
        };
        message.To.Add(toEmail);

        await client.SendMailAsync(message, ct);
        _logger.LogInformation("Email sent to {Email} with subject {Subject}", toEmail, subject);
    }

    private class SmtpOptions
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; }
        public string User { get; set; } = string.Empty;
        public string Pass { get; set; } = string.Empty;
        public string FromAddress { get; set; } = string.Empty;
    }
}
