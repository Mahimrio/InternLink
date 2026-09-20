namespace InternLinkApi.Models.Enums;

public enum IntegrationFeature
{
    AtsScoring,
    ResumeSuggestions,
    JobMatching,
    CoverLetter,
    InterviewQuestions,
    MockInterview,
    SkillGap,

    /// <summary>AI smart-paste: structured field extraction from a raw external job description.</summary>
    ExternalJobParsing
}
