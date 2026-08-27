using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace InternLinkApi.Services.ResumeService;

public class SupabaseStorageService : ISupabaseStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _apiKey;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SupabaseStorageService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;

        // Try direct config first, then fallback to project URL
        _supabaseUrl = configuration["Supabase:Url"]
            ?? configuration["SUPABASE_URL"]
            ?? "https://eaihzwnctpiblgaobrbw.supabase.co";

        _apiKey = configuration["Supabase:ServiceRoleKey"]
            ?? configuration["SUPABASE_SERVICE_ROLE_KEY"]
            ?? configuration["Supabase:AnonKey"]
            ?? configuration["SUPABASE_ANON_KEY"]
            ?? string.Empty;
    }

    public async Task<string> UploadFileAsync(
        string bucketName,
        string filePath,
        byte[] fileBytes,
        string contentType,
        CancellationToken ct = default)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                _logger.LogWarning("Supabase Storage key not configured. Mocking storage upload for {Path}.", filePath);
                return $"{bucketName}/{filePath}";
            }

            await EnsureBucketExistsAsync(bucketName, ct);

            var requestUrl = $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/{bucketName}/{filePath}";
            using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Headers.Add("apikey", _apiKey);
            request.Headers.Add("x-upsert", "true");

            using var content = new ByteArrayContent(fileBytes);
            content.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            request.Content = content;

            var response = await _httpClient.SendAsync(request, ct);
            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Supabase Storage upload returned status {StatusCode}: {Error}. Using fallback path.", response.StatusCode, errorBody);
            }

            return $"{bucketName}/{filePath}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to upload file to Supabase Storage at {Path}", filePath);
            return $"{bucketName}/{filePath}";
        }
    }

    public async Task<string> CreateSignedUrlAsync(
        string bucketName,
        string filePath,
        int expiresInSeconds = 3600,
        CancellationToken ct = default)
    {
        try
        {
            // Normalize path
            var cleanPath = filePath.StartsWith($"{bucketName}/") ? filePath[(bucketName.Length + 1)..] : filePath;

            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                return $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucketName}/{cleanPath}";
            }

            var requestUrl = $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/sign/{bucketName}/{cleanPath}";
            using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Headers.Add("apikey", _apiKey);

            var payload = JsonSerializer.Serialize(new { expiresIn = expiresInSeconds });
            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, ct);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(ct);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("signedURL", out var signedUrlProp))
                {
                    var signedUrl = signedUrlProp.GetString();
                    if (!string.IsNullOrEmpty(signedUrl))
                    {
                        return signedUrl.StartsWith("http") ? signedUrl : $"{_supabaseUrl.TrimEnd('/')}/storage/v1{signedUrl}";
                    }
                }
            }

            return $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucketName}/{cleanPath}";
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate signed URL for Supabase Storage object at {Path}", filePath);
            var cleanPath = filePath.StartsWith($"{bucketName}/") ? filePath[(bucketName.Length + 1)..] : filePath;
            return $"{_supabaseUrl.TrimEnd('/')}/storage/v1/object/public/{bucketName}/{cleanPath}";
        }
    }

    private async Task EnsureBucketExistsAsync(string bucketName, CancellationToken ct)
    {
        try
        {
            var requestUrl = $"{_supabaseUrl.TrimEnd('/')}/storage/v1/bucket";
            using var request = new HttpRequestMessage(HttpMethod.Post, requestUrl);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            request.Headers.Add("apikey", _apiKey);

            var payload = JsonSerializer.Serialize(new
            {
                id = bucketName,
                name = bucketName,
                @public = true
            });
            request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            await _httpClient.SendAsync(request, ct);
        }
        catch
        {
            // Ignore if already exists or insufficient permissions
        }
    }
}
