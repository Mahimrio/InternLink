namespace InternLinkApi.Services.ResumeService;

public interface ISupabaseStorageService
{
    Task<string> UploadFileAsync(string bucketName, string filePath, byte[] fileBytes, string contentType, CancellationToken ct = default);
    Task<string> CreateSignedUrlAsync(string bucketName, string filePath, int expiresInSeconds = 3600, CancellationToken ct = default);
}
