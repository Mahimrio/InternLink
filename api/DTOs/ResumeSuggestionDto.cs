namespace InternLinkApi.DTOs;

/// <summary>A concrete before/after resume improvement, renderable as a diff.</summary>
public record ResumeSuggestionDto(
    string OriginalText,
    string SuggestedText,
    string Reason
);
