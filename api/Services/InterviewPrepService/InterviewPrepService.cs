using System.Text.Json;
using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;
using InternLinkApi.Services.AIService;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Services.InterviewPrepService;

public class InterviewPrepService : IInterviewPrepService
{
    private readonly ApplicationDbContext _db;
    private readonly IStudentRepository _studentRepository;
    private readonly IJobRepository _jobRepository;
    private readonly ILlmClient _llmClient;
    private readonly ILogger<InterviewPrepService> _logger;

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = false
    };

    public InterviewPrepService(
        ApplicationDbContext db,
        IStudentRepository studentRepository,
        IJobRepository jobRepository,
        ILlmClient llmClient,
        ILogger<InterviewPrepService> logger)
    {
        _db = db;
        _studentRepository = studentRepository;
        _jobRepository = jobRepository;
        _llmClient = llmClient;
        _logger = logger;
    }

    // ── 1. Generate Question Bank ────────────────────────────────────────
    public async Task<GenerateInterviewQuestionsResponseDto> GenerateQuestionsAsync(
        Guid userId, string role, Guid? jobId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetWithSkillsByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        string jobContext = await BuildJobContextAsync(jobId, ct);
        string studentSkills = BuildStudentSkillsSummary(student);

        var systemPrompt =
            "You are a senior technical recruiter and interview coach.\n" +
            "Generate exactly 8 interview questions for the candidate. Mix three categories:\n" +
            "- Technical (3-4 questions): role-specific coding, system design, or domain knowledge.\n" +
            "- Situational (2-3 questions): STAR-format behavioral scenarios relevant to the role.\n" +
            "- HR (1-2 questions): cultural fit, career motivation, teamwork.\n\n" +
            "Output as a JSON array of objects with fields \"questionText\" and \"category\" (one of \"Technical\", \"Situational\", \"HR\").\n" +
            "No markdown fences, no commentary — only the JSON array.";

        var userPrompt =
            $"Target role: {role}\n" +
            $"Candidate skills: {studentSkills}\n" +
            $"Candidate major: {student.Department}\n" +
            (string.IsNullOrEmpty(jobContext) ? "" : $"Job details:\n{jobContext}\n") +
            "Generate the 8 questions now.";

        try
        {
            var llmResponse = await _llmClient.CompletePromptAsync(
                systemPrompt, userPrompt,
                IntegrationFeature.InterviewQuestions, userId, ct);

            var questions = ParseQuestionArray(llmResponse.Content, role);
            return new GenerateInterviewQuestionsResponseDto(questions);
        }
        catch (AiServiceException ex)
        {
            _logger.LogError(ex, "AI question generation failed for user {UserId}", userId);
            return new GenerateInterviewQuestionsResponseDto(GenerateFallbackQuestions(role));
        }
    }

    // ── 2. Start Mock Interview Session ──────────────────────────────────
    public async Task<StartMockInterviewSessionResponseDto> StartSessionAsync(
        Guid userId, string role, Guid? jobId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        if (jobId.HasValue)
        {
            var job = await _jobRepository.GetByIdAsync(jobId.Value, ct);
            if (job is null) throw new KeyNotFoundException("Job posting not found.");
        }

        string firstQuestion = await GenerateOpeningQuestionAsync(userId, role, jobId, ct);

        var transcript = new List<TranscriptEntry>
        {
            new("interviewer", firstQuestion, DateTimeOffset.UtcNow)
        };

        var session = new MockInterviewSession
        {
            StudentId = student.Id,
            JobId = jobId,
            Role = role,
            TranscriptJson = JsonSerializer.Serialize(transcript, JsonOpts),
            Status = MockInterviewStatus.InProgress
        };

        _db.MockInterviewSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        return new StartMockInterviewSessionResponseDto(session.Id, firstQuestion, role);
    }

    // ── 3. Send Message (Turn-by-Turn) ───────────────────────────────────
    public async Task<SendInterviewMessageResponseDto> SendMessageAsync(
        Guid userId, Guid sessionId, string studentReply, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var session = await _db.MockInterviewSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.StudentId == student.Id, ct)
            ?? throw new KeyNotFoundException("Interview session not found.");

        if (session.Status == MockInterviewStatus.Completed)
            throw new InvalidOperationException("This interview session has already ended.");

        var transcript = DeserializeTranscript(session.TranscriptJson);

        // Append candidate reply
        transcript.Add(new TranscriptEntry("candidate", studentReply, DateTimeOffset.UtcNow));

        // Build the conversational history for the LLM
        var systemPrompt = BuildInterviewerSystemPrompt(session.Role);
        var conversationPrompt = BuildConversationPrompt(transcript);

        string aiReply;
        try
        {
            var llmResponse = await _llmClient.CompletePromptAsync(
                systemPrompt, conversationPrompt,
                IntegrationFeature.MockInterview, userId, ct);

            aiReply = CleanLlmText(llmResponse.Content);
        }
        catch (AiServiceException ex)
        {
            _logger.LogError(ex, "AI mock interview reply failed for session {SessionId}", sessionId);
            aiReply = GenerateFallbackInterviewReply(session.Role, transcript, studentReply);
        }

        // Append interviewer reply
        transcript.Add(new TranscriptEntry("interviewer", aiReply, DateTimeOffset.UtcNow));
        session.TranscriptJson = JsonSerializer.Serialize(transcript, JsonOpts);

        await _db.SaveChangesAsync(ct);

        // Auto-end after ~10 exchanges (5 pairs of Q&A) to keep sessions focused
        bool isCompleted = transcript.Count(t => t.Role == "candidate") >= 5;

        return new SendInterviewMessageResponseDto(aiReply, isCompleted);
    }

    // ── 4. End Session & Generate Report ─────────────────────────────────
    public async Task<InterviewReportDto> EndSessionAsync(
        Guid userId, Guid sessionId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var session = await _db.MockInterviewSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.StudentId == student.Id, ct)
            ?? throw new KeyNotFoundException("Interview session not found.");

        if (session.Status == MockInterviewStatus.Completed)
        {
            // Already completed — return existing report
            if (!string.IsNullOrWhiteSpace(session.ReportJson))
            {
                var existing = JsonSerializer.Deserialize<InterviewReportDto>(session.ReportJson, JsonOpts);
                if (existing is not null) return existing;
            }
        }

        var transcript = DeserializeTranscript(session.TranscriptJson);
        var report = await GenerateCoachingReportAsync(userId, session.Role, transcript, ct);

        session.Status = MockInterviewStatus.Completed;
        session.CompletedAt = DateTimeOffset.UtcNow;
        session.ReportJson = JsonSerializer.Serialize(report, JsonOpts);

        await _db.SaveChangesAsync(ct);

        return report;
    }

    // ── 5. Get Session Detail ────────────────────────────────────────────
    public async Task<MockInterviewSessionDetailDto?> GetSessionAsync(
        Guid userId, Guid sessionId, CancellationToken ct = default)
    {
        var student = await _studentRepository.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Student profile not found.");

        var session = await _db.MockInterviewSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.StudentId == student.Id, ct);

        if (session is null) return null;

        var transcript = DeserializeTranscript(session.TranscriptJson);
        var messages = transcript.Select(t => new ChatMessageDto(t.Role, t.Content, t.Timestamp)).ToList();

        InterviewReportDto? report = null;
        if (!string.IsNullOrWhiteSpace(session.ReportJson))
        {
            report = JsonSerializer.Deserialize<InterviewReportDto>(session.ReportJson, JsonOpts);
        }

        return new MockInterviewSessionDetailDto(
            session.Id,
            session.Role,
            session.JobId,
            session.Status.ToString(),
            messages,
            report,
            session.CreatedAt,
            session.CompletedAt);
    }

    // ── Private helpers ─────────────────────────────────────────────────

    private async Task<string> GenerateOpeningQuestionAsync(
        Guid userId, string role, Guid? jobId, CancellationToken ct)
    {
        var systemPrompt =
            $"You are a professional technical interviewer conducting an interview for a {role} position.\n" +
            "Ask a warm but professional opening question that helps the candidate ease in.\n" +
            "Ask about their background and what drew them to this field.\n" +
            "Be conversational but concise (2-3 sentences max). Output only the question, nothing else.";

        string jobContext = await BuildJobContextAsync(jobId, ct);
        var userPrompt = string.IsNullOrEmpty(jobContext)
            ? $"Start the interview for the {role} role."
            : $"Start the interview for the {role} role. Job context:\n{jobContext}";

        try
        {
            var response = await _llmClient.CompletePromptAsync(
                systemPrompt, userPrompt,
                IntegrationFeature.MockInterview, userId, ct);

            return CleanLlmText(response.Content);
        }
        catch (AiServiceException ex)
        {
            _logger.LogError(ex, "Failed to generate opening question");
            return $"Welcome! Thank you for joining this interview for the {role} position. " +
                   "Could you start by telling me a bit about your background and what interests you about this field?";
        }
    }

    private async Task<InterviewReportDto> GenerateCoachingReportAsync(
        Guid userId, string role, List<TranscriptEntry> transcript, CancellationToken ct)
    {
        var systemPrompt =
            "You are an expert interview coach evaluating a mock interview session.\n" +
            "Analyze the complete conversation transcript and produce a structured coaching report.\n\n" +
            "Output ONLY valid JSON with these exact fields:\n" +
            "{\n" +
            "  \"accuracySummary\": \"A 2-4 sentence overall assessment of how well the candidate performed.\",\n" +
            "  \"logicGaps\": [\"Gap 1 description\", \"Gap 2 description\"],\n" +
            "  \"improvementSuggestions\": [\"Suggestion 1\", \"Suggestion 2\"]\n" +
            "}\n\n" +
            "Be constructive, specific, and encouraging. Reference actual answers from the transcript.";

        var conversationText = string.Join("\n",
            transcript.Select(t => $"{(t.Role == "interviewer" ? "Interviewer" : "Candidate")}: {t.Content}"));

        var userPrompt =
            $"Role being interviewed for: {role}\n\n" +
            $"Interview Transcript:\n{conversationText}\n\n" +
            "Generate the coaching report now.";

        try
        {
            var llmResponse = await _llmClient.CompletePromptAsync(
                systemPrompt, userPrompt,
                IntegrationFeature.MockInterview, userId, ct);

            return ParseCoachingReport(llmResponse.Content);
        }
        catch (AiServiceException ex)
        {
            _logger.LogError(ex, "AI coaching report generation failed");
            return new InterviewReportDto(
                AccuracySummary: "Thank you for completing this mock interview. While we couldn't generate a detailed AI analysis at this time, " +
                    "reviewing your transcript can help identify areas of strength and improvement.",
                LogicGaps: ["AI analysis temporarily unavailable. Please review your answers in the transcript."],
                ImprovementSuggestions: [
                    "Practice structuring answers using the STAR method (Situation, Task, Action, Result).",
                    "Prepare 2-3 specific project examples that demonstrate your technical skills.",
                    "Research the company and role thoroughly before the real interview."
                ]);
        }
    }

    private async Task<string> BuildJobContextAsync(Guid? jobId, CancellationToken ct)
    {
        if (!jobId.HasValue) return string.Empty;

        var job = await _db.Jobs
            .Include(j => j.Company)
            .Include(j => j.JobSkills).ThenInclude(js => js.Skill)
            .AsNoTracking()
            .FirstOrDefaultAsync(j => j.Id == jobId.Value, ct);

        if (job is null) return string.Empty;

        var skills = job.JobSkills.Any()
            ? string.Join(", ", job.JobSkills.Select(js => js.Skill?.SkillName ?? "General"))
            : "General software development";

        return $"Title: {job.Title}\n" +
               $"Company: {job.Company?.CompanyName ?? job.CompanyNameSnapshot ?? "N/A"}\n" +
               $"Required skills: {skills}\n" +
               $"Description: {job.CoreDescription ?? "N/A"}";
    }

    private static string BuildStudentSkillsSummary(Student student)
    {
        if (student.StudentSkills is null || !student.StudentSkills.Any())
            return "General software development";

        return string.Join(", ", student.StudentSkills
            .Where(ss => ss.Skill is not null)
            .Select(ss => ss.Skill!.SkillName));
    }

    private static string BuildInterviewerSystemPrompt(string role)
    {
        return
            $"You are a professional, empathetic but rigorous technical interviewer conducting a mock interview " +
            $"for a {role} position at a technology company.\n\n" +
            "RULES:\n" +
            "1. Stay in character as the interviewer at all times. Never break character.\n" +
            "2. Ask ONE question at a time. Wait for the candidate's response before asking the next.\n" +
            "3. After the candidate answers, briefly acknowledge their answer (1 sentence) then ask a follow-up or new question.\n" +
            "4. Mix question types: technical depth, situational (STAR), and soft-skill / cultural fit.\n" +
            "5. If the candidate's answer is vague or incomplete, probe deeper with a clarifying follow-up.\n" +
            "6. Keep your responses concise (3-5 sentences max).\n" +
            "7. Be encouraging but honest. Don't give away answers.\n" +
            "8. Do NOT output any JSON, markdown, or meta-commentary. Speak naturally as an interviewer would.";
    }

    private static string BuildConversationPrompt(List<TranscriptEntry> transcript)
    {
        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Here is the interview conversation so far:");
        sb.AppendLine();

        foreach (var entry in transcript)
        {
            var speaker = entry.Role == "interviewer" ? "Interviewer" : "Candidate";
            sb.AppendLine($"{speaker}: {entry.Content}");
        }

        sb.AppendLine();
        sb.AppendLine("Continue the interview. Respond as the Interviewer with your next question or follow-up.");

        return sb.ToString();
    }

    private static List<InterviewQuestionItemDto> ParseQuestionArray(string content, string role)
    {
        var cleaned = CleanJsonContent(content);

        try
        {
            var items = JsonSerializer.Deserialize<List<QuestionParseModel>>(cleaned, JsonOpts);
            if (items is not null && items.Count > 0)
            {
                var validItems = items
                    .Where(i => !string.IsNullOrWhiteSpace(i.QuestionText ?? i.Question ?? i.Text))
                    .Select(i => new InterviewQuestionItemDto(
                        (i.QuestionText ?? i.Question ?? i.Text)!.Trim(),
                        NormalizeCategory(i.Category ?? i.Type ?? "Technical")
                    ))
                    .ToList();

                if (validItems.Count > 0) return validItems;
            }
        }
        catch (JsonException ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to parse question JSON: {ex.Message}");
        }

        return GenerateFallbackQuestions(role);
    }

    private static InterviewReportDto ParseCoachingReport(string content)
    {
        var cleaned = CleanJsonContent(content);

        try
        {
            var report = JsonSerializer.Deserialize<ReportParseModel>(cleaned, JsonOpts);
            if (report is not null)
            {
                return new InterviewReportDto(
                    report.AccuracySummary ?? "Performance analysis completed.",
                    report.LogicGaps ?? [],
                    report.ImprovementSuggestions ?? []);
            }
        }
        catch (JsonException ex)
        {
            System.Diagnostics.Debug.WriteLine($"Failed to parse report JSON: {ex.Message}");
        }

        return new InterviewReportDto(
            "Your interview session has been completed. Review the transcript for detailed insights.",
            [],
            ["Practice with more mock interviews to build confidence."]);
    }

    private static string CleanJsonContent(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;

        var text = raw.Trim();

        // Strip markdown code fences (e.g. ```json ... ```)
        if (text.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNewline = text.IndexOf('\n');
            if (firstNewline != -1) text = text[(firstNewline + 1)..];
            if (text.EndsWith("```", StringComparison.Ordinal))
                text = text[..^3].Trim();
        }

        var firstBrace = text.IndexOf('{');
        var firstBracket = text.IndexOf('[');

        if (firstBracket != -1 && (firstBrace == -1 || firstBracket < firstBrace))
        {
            var lastBracket = text.LastIndexOf(']');
            if (lastBracket > firstBracket)
            {
                text = text.Substring(firstBracket, lastBracket - firstBracket + 1);
            }
        }
        else if (firstBrace != -1)
        {
            var lastBrace = text.LastIndexOf('}');
            if (lastBrace > firstBrace)
            {
                text = text.Substring(firstBrace, lastBrace - firstBrace + 1);
            }
        }

        return text.Trim();
    }

    private static string CleanLlmText(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return string.Empty;

        var text = raw.Trim();
        if (text.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNewline = text.IndexOf('\n');
            if (firstNewline != -1) text = text[(firstNewline + 1)..];
            if (text.EndsWith("```", StringComparison.Ordinal))
                text = text[..^3].Trim();
        }

        return text.Trim();
    }

    private static string NormalizeCategory(string raw)
    {
        var lower = raw.Trim().ToLowerInvariant();
        return lower switch
        {
            "technical" or "tech" or "coding" or "system design" => "Technical",
            "hr" or "human resources" or "cultural" or "fit" => "HR",
            "situational" or "behavioral" or "scenario" or "star" => "Situational",
            _ => "Technical"
        };
    }

    private static string GenerateFallbackInterviewReply(string role, List<TranscriptEntry> transcript, string latestReply)
    {
        var cleanRole = string.IsNullOrWhiteSpace(role) ? "Software Engineer" : role.Trim();
        var candidateTurns = transcript.Count(t => t.Role == "candidate");

        return candidateTurns switch
        {
            1 => $"Thank you for that overview. Focusing on {cleanRole}, what specific technologies, programming languages, or frameworks have you utilized most heavily in your projects?",
            2 => $"That is very relevant hands-on experience. Could you walk me through a challenging technical problem or unexpected bug you encountered in that work and how you diagnosed it?",
            3 => $"Great explanation. In team environments, how do you handle code reviews, disagreements over architectural decisions, or shifting project deadlines?",
            4 => $"Understood. If you were tasked with redesigning or scaling that system to handle significantly higher throughput or larger datasets, what improvements would you prioritize?",
            _ => $"Thank you for that detailed walkthrough. To conclude our conversation, what excites you most about joining our team as a {cleanRole}, and what questions do you have for us?"
        };
    }

    private static List<InterviewQuestionItemDto> GenerateFallbackQuestions(string role)
    {
        var normalized = (role ?? string.Empty).ToLowerInvariant().Trim();

        // 1. Frontend / UI / Web Client roles
        if (normalized.Contains("front") || normalized.Contains("ui") || normalized.Contains("react") || normalized.Contains("web") || normalized.Contains("css") || normalized.Contains("next"))
        {
            return
            [
                new("How does the Virtual DOM reconciliation algorithm work in React, and what techniques do you use to prevent unnecessary component re-renders?", "Technical"),
                new("Explain the architectural differences between Client-Side Rendering (CSR), Server-Side Rendering (SSR), and Static Site Generation (SSG) in modern web applications.", "Technical"),
                new("How do you optimize Core Web Vitals (such as LCP, FID, and CLS) and improve asset loading performance for large frontend bundles?", "Technical"),
                new("How do you ensure web applications are fully accessible (WCAG AA compliant) using semantic HTML and ARIA attributes?", "Technical"),
                new("Describe a situation where a frontend rendering or state management bug occurred on specific browsers or viewports. How did you diagnose and resolve it?", "Situational"),
                new("Tell me about a time you collaborated with UI/UX designers and had to negotiate a technical constraint or performance trade-off.", "Situational"),
                new("Why are you passionate about frontend engineering and building interactive, accessible user experiences?", "HR"),
                new("How do you stay up-to-date with evolving JavaScript, TypeScript, and CSS standards?", "HR"),
            ];
        }

        // 2. Data / AI / ML / Data Science / Analytics roles
        if (normalized.Contains("data") || normalized.Contains("ml") || normalized.Contains("ai") || normalized.Contains("learning") || normalized.Contains("analytics") || normalized.Contains("python"))
        {
            return
            [
                new("How do you handle missing data, categorical feature encoding, and feature scaling in an end-to-end data preprocessing pipeline?", "Technical"),
                new("Explain the trade-offs between Precision, Recall, F1-Score, and ROC-AUC when evaluating a classification model under class imbalance.", "Technical"),
                new("How would you design a scalable ETL / data ingestion pipeline that processes both batch and real-time streaming data?", "Technical"),
                new("Explain how self-attention mechanisms in Transformer architectures differ from recurrent and convolutional neural networks.", "Technical"),
                new("Describe a project where your initial model had high accuracy during training but suffered from overfitting on test data. How did you resolve it?", "Situational"),
                new("Tell me about a time you had to explain complex machine learning or data analytics findings to non-technical stakeholders.", "Situational"),
                new("What motivated you to pursue a career in data science and artificial intelligence?", "HR"),
                new("What specific area of applied machine learning or data engineering are you most excited to explore in an industry setting?", "HR"),
            ];
        }

        // 3. DevOps / Cloud / SRE / Infrastructure roles
        if (normalized.Contains("devops") || normalized.Contains("cloud") || normalized.Contains("sre") || normalized.Contains("infra") || normalized.Contains("docker") || normalized.Contains("kubernetes") || normalized.Contains("aws") || normalized.Contains("azure"))
        {
            return
            [
                new("How do you design a zero-downtime CI/CD deployment pipeline using strategies like Blue-Green or Canary deployments?", "Technical"),
                new("Explain how Kubernetes manages container orchestration, Pod scheduling, health probes, and persistent volume claims.", "Technical"),
                new("How do you implement secure secret management and Infrastructure as Code (IaC) with tools like Terraform or Docker Compose?", "Technical"),
                new("What telemetry metrics (RED / USE method) do you monitor to detect latency spikes and resource saturation in distributed services?", "Technical"),
                new("Tell me about a time an unexpected build or deployment failure broke a staging or production environment. How did you triage and fix it?", "Situational"),
                new("Describe how you balance engineering velocity with strict security, infrastructure hardening, and compliance requirements.", "Situational"),
                new("What drew you to DevOps and cloud infrastructure engineering?", "HR"),
                new("How do you foster effective collaboration between software developers and operations teams?", "HR"),
            ];
        }

        // 4. Mobile / iOS / Android / Flutter / React Native roles
        if (normalized.Contains("mobile") || normalized.Contains("android") || normalized.Contains("ios") || normalized.Contains("flutter") || normalized.Contains("swift") || normalized.Contains("kotlin"))
        {
            return
            [
                new("How do you manage mobile application lifecycle events, background processing, and battery/memory constraints on mobile operating systems?", "Technical"),
                new("Explain your approach to offline-first local data persistence and syncing changes with remote REST/GraphQL APIs.", "Technical"),
                new("How do you optimize mobile UI rendering performance and eliminate frame drops (jank) during heavy list scrolling and animations?", "Technical"),
                new("What security best practices do you implement for storing sensitive auth tokens and handling biometric authentication on mobile devices?", "Technical"),
                new("Describe a time an app update crashed on a specific device model or OS version. How did you reproduce, debug, and patch it?", "Situational"),
                new("Tell me about a situation where you had to collaborate with backend engineers to optimize mobile API payload sizes for weak network connections.", "Situational"),
                new("Why are you enthusiastic about native or cross-platform mobile application development?", "HR"),
                new("How do you ensure consistent user experience across varied screen sizes, aspect ratios, and device resolutions?", "HR"),
            ];
        }

        // 5. Cybersecurity / Security / Penetration Testing / Infosec roles
        if (normalized.Contains("sec") || normalized.Contains("cyber") || normalized.Contains("pentest") || normalized.Contains("auth") || normalized.Contains("crypto"))
        {
            return
            [
                new("Walk me through the OWASP Top 10 vulnerabilities and how you mitigate Cross-Site Scripting (XSS), SQL Injection, and CSRF in web applications.", "Technical"),
                new("How does Public Key Infrastructure (PKI), TLS handshake, and asymmetric cryptography establish secure communication channels?", "Technical"),
                new("How would you perform threat modeling and security risk assessment for a newly designed distributed web architecture?", "Technical"),
                new("Explain potential security vulnerabilities associated with JWT authentication tokens and how to implement token rotation and revocation securely.", "Technical"),
                new("Describe how you would approach an incident response scenario where unauthorized API token usage is detected in production logs.", "Situational"),
                new("Tell me about a time you discovered a vulnerability in a codebase and had to communicate its severity to developers and management.", "Situational"),
                new("Why did you decide to pursue cybersecurity and defensive software engineering?", "HR"),
                new("How do you stay informed about newly disclosed zero-day vulnerabilities and emerging cyber threat trends?", "HR"),
            ];
        }

        // 6. Quality Assurance / Software Testing / SDET roles
        if (normalized.Contains("qa") || normalized.Contains("test") || normalized.Contains("sdet") || normalized.Contains("quality"))
        {
            return
            [
                new("What is the distinction between unit, integration, end-to-end (E2E), and regression testing, and how do you structure the testing pyramid?", "Technical"),
                new("How do you design robust and maintainable test automation suites using frameworks such as Playwright, Cypress, or Selenium?", "Technical"),
                new("How do you determine boundary value test cases and equivalence partitioning for complex algorithmic inputs?", "Technical"),
                new("How do you integrate automated test suites into CI/CD pipelines to block regressions before production merges?", "Technical"),
                new("Tell me about a time a subtle bug slipped past automated testing into production. How did you perform the post-mortem?", "Situational"),
                new("Describe a situation where a developer believed an issue was not a bug. How did you document the behavior and resolve the disagreement?", "Situational"),
                new("What makes a top-performing Quality Assurance / SDET engineer in a software development team?", "HR"),
                new("How do you advocate for test coverage and code quality standards in fast-paced development cycles?", "HR"),
            ];
        }

        // 7. Backend / API / Distributed Systems / .NET / Java / Node roles
        if (normalized.Contains("back") || normalized.Contains("api") || normalized.Contains("server") || normalized.Contains("net") || normalized.Contains("c#") || normalized.Contains("java") || normalized.Contains("node") || normalized.Contains("golang") || normalized.Contains("rust") || normalized.Contains("sql"))
        {
            return
            [
                new("How do you design a high-throughput, versioned RESTful API with proper pagination, rate limiting, and idempotency guarantees?", "Technical"),
                new("Explain how relational database indexing (B-Tree) works, how to analyze query execution plans, and when to introduce distributed caching with Redis.", "Technical"),
                new("How do you handle distributed transactions, concurrency control, and data consistency across microservices (e.g. Saga pattern, outbox pattern)?", "Technical"),
                new("How do you secure backend endpoints against SQL injection, Insecure Direct Object References (IDOR), and broken access controls?", "Technical"),
                new("Tell me about a time a backend service or background job encountered a performance bottleneck or memory leak. How did you profile and resolve it?", "Situational"),
                new("Describe a situation where you had to refactor a complex database schema or legacy service without causing downtime for existing clients.", "Situational"),
                new("What excites you most about backend engineering and high-scale systems architecture?", "HR"),
                new("Where do you see yourself growing as a backend software engineer over the next 3 years?", "HR"),
            ];
        }

        // 8. General / Fullstack / Software Engineer roles (Adaptive fallback)
        var cleanRole = string.IsNullOrWhiteSpace(role) ? "Software Engineer" : role.Trim();
        return
        [
            new($"Describe a challenging software engineering project you worked on recently relevant to {cleanRole}. What was your specific technical role?", "Technical"),
            new($"How would you design a scalable architecture for a {cleanRole} application from scratch? Walk me through your design choices.", "Technical"),
            new("Explain the core differences between relational and non-relational databases, and how you evaluate which database technology to adopt.", "Technical"),
            new("What data structures and algorithmic trade-offs would you consider when designing a real-time event processing system?", "Technical"),
            new("Tell me about a time you had to deliver a critical technical milestone under a tight deadline. How did you prioritize tasks?", "Situational"),
            new("Describe a situation where you had a technical disagreement with a teammate regarding code design or architecture. How did you resolve it?", "Situational"),
            new($"Why are you interested in this {cleanRole} position, and how does it align with your academic background and career goals?", "HR"),
            new("How do you approach learning new frameworks, programming languages, and industry toolchains?", "HR"),
        ];
    }

    private static List<TranscriptEntry> DeserializeTranscript(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return [];

        try
        {
            return JsonSerializer.Deserialize<List<TranscriptEntry>>(json, JsonOpts) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    // ── Internal DTOs for JSON parsing ──────────────────────────────────
    private record TranscriptEntry(string Role, string Content, DateTimeOffset Timestamp);

    private class QuestionParseModel
    {
        public string? QuestionText { get; set; }
        public string? Question { get; set; }
        public string? Text { get; set; }
        public string? Category { get; set; }
        public string? Type { get; set; }
    }

    private class ReportParseModel
    {
        public string? AccuracySummary { get; set; }
        public List<string>? LogicGaps { get; set; }
        public List<string>? ImprovementSuggestions { get; set; }
    }
}
