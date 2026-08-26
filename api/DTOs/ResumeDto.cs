namespace InternLinkApi.DTOs;

public record ResumeDto(
    Guid Id,
    DateTimeOffset LastModified,
    string? DownloadUrl,
    string? DynamicJsonData
);
