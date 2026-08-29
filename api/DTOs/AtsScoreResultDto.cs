namespace InternLinkApi.DTOs;

/// <summary>ATS analysis of a resume. AtsScore of -1 is the sentinel for "analysis unavailable".</summary>
public record AtsScoreResultDto(
    int AtsScore,
    List<string> GrammarIssues,
    string StructureCritique,
    List<string> MissingKeywords
);
