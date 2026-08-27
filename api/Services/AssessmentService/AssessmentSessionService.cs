using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace InternLinkApi.Services.AssessmentService;

public class AssessmentSessionService : IAssessmentSessionService
{
    private readonly byte[] _signingKey;

    public AssessmentSessionService(IConfiguration configuration)
    {
        var secret = configuration["Jwt:Key"] ?? "InternLink_Default_Secure_Assessment_Key_2026_AUST_Secret";
        _signingKey = Encoding.UTF8.GetBytes(secret.PadRight(32));
    }

    public string CreateSessionToken(
        Guid studentId,
        Guid skillId,
        string skillName,
        List<string> questionIds,
        int timeLimitSeconds = 600,
        int graceBufferSeconds = 15)
    {
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        var expiresAt = now + timeLimitSeconds + graceBufferSeconds;

        var payload = new AssessmentSessionPayload(
            studentId,
            skillId,
            skillName,
            now,
            expiresAt,
            questionIds
        );

        var payloadJson = JsonSerializer.Serialize(payload);
        var payloadBytes = Encoding.UTF8.GetBytes(payloadJson);
        var payloadB64 = Base64UrlEncode(payloadBytes);

        using var hmac = new HMACSHA256(_signingKey);
        var signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadB64));
        var signatureB64 = Base64UrlEncode(signatureBytes);

        return $"{payloadB64}.{signatureB64}";
    }

    public bool TryValidateSessionToken(
        string token,
        Guid expectedStudentId,
        out AssessmentSessionPayload? payload,
        out string? errorMessage)
    {
        payload = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(token))
        {
            errorMessage = "Assessment session token is missing.";
            return false;
        }

        var parts = token.Split('.');
        if (parts.Length != 2)
        {
            errorMessage = "Malformed assessment session token.";
            return false;
        }

        var payloadB64 = parts[0];
        var signatureB64 = parts[1];

        // 1. Verify HMAC signature
        using var hmac = new HMACSHA256(_signingKey);
        var computedSignature = hmac.ComputeHash(Encoding.UTF8.GetBytes(payloadB64));
        var computedSignatureB64 = Base64UrlEncode(computedSignature);

        if (!CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(signatureB64),
            Encoding.UTF8.GetBytes(computedSignatureB64)))
        {
            errorMessage = "Invalid assessment session signature.";
            return false;
        }

        // 2. Deserialize payload
        try
        {
            var payloadBytes = Base64UrlDecode(payloadB64);
            var payloadJson = Encoding.UTF8.GetString(payloadBytes);
            payload = JsonSerializer.Deserialize<AssessmentSessionPayload>(payloadJson);
        }
        catch
        {
            errorMessage = "Failed to deserialize assessment session payload.";
            return false;
        }

        if (payload == null)
        {
            errorMessage = "Null assessment session payload.";
            return false;
        }

        // 3. Verify student identity
        if (payload.StudentId != expectedStudentId)
        {
            errorMessage = "Assessment session does not belong to the authenticated student.";
            payload = null;
            return false;
        }

        // 4. Verify expiration (10 minutes + 15s grace period)
        var now = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
        if (now > payload.ExpiresAt)
        {
            var elapsed = now - payload.StartedAt;
            errorMessage = $"Assessment session expired. Elapsed time ({elapsed}s) exceeded the 10-minute limit.";
            payload = null;
            return false;
        }

        return true;
    }

    private static string Base64UrlEncode(byte[] input)
    {
        return Convert.ToBase64String(input)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }

    private static byte[] Base64UrlDecode(string input)
    {
        var output = input.Replace('-', '+').Replace('_', '/');
        switch (output.Length % 4)
        {
            case 2: output += "=="; break;
            case 3: output += "="; break;
        }
        return Convert.FromBase64String(output);
    }
}
