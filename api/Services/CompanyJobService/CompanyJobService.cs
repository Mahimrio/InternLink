using InternLinkApi.DTOs;
using InternLinkApi.Exceptions;
using InternLinkApi.Helpers;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using InternLinkApi.Repositories.Interface;

namespace InternLinkApi.Services.CompanyJobService;

public class CompanyJobService : ICompanyJobService
{
    private readonly IJobRepository _jobRepo;
    private readonly ICompanyRepository _companyRepo;
    private readonly IRepository<Skill> _skillRepo;

    public CompanyJobService(
        IJobRepository jobRepo,
        ICompanyRepository companyRepo,
        IRepository<Skill> skillRepo)
    {
        _jobRepo = jobRepo;
        _companyRepo = companyRepo;
        _skillRepo = skillRepo;
    }

    public async Task<CompanyVerificationContext?> GetVerificationContextAsync(Guid userId, CancellationToken ct = default)
    {
        var company = await _companyRepo.GetByUserIdAsync(userId, ct);
        if (company is null) return null;

        return new CompanyVerificationContext(company.Id, company.VerificationStatus);
    }

    public async Task<PagedResultDto<CompanyJobDto>> GetCompanyJobsAsync(
        Guid userId, int page, int pageSize, CancellationToken ct = default)
    {
        var company = await _companyRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Company profile not found.");

        var (jobs, totalCount) = await _jobRepo.GetPagedByCompanyAsync(company.Id, page, pageSize, ct);
        return new PagedResultDto<CompanyJobDto>(
            JobMapper.ToCompanyDtoList(jobs), totalCount, page, pageSize);
    }

    public async Task<CompanyJobDto?> GetCompanyJobByIdAsync(Guid userId, Guid jobId, CancellationToken ct = default)
    {
        var company = await _companyRepo.GetByUserIdAsync(userId, ct)
            ?? throw new KeyNotFoundException("Company profile not found.");

        var job = await _jobRepo.GetByIdWithSkillsAsync(jobId, ct);
        if (job is null || job.CompanyId != company.Id)
        {
            return null;
        }

        return JobMapper.ToCompanyDto(job);
    }

    public async Task<IReadOnlyList<SkillOptionDto>> GetSkillOptionsAsync(CancellationToken ct = default)
    {
        var skills = await _skillRepo.GetAllAsync(ct);
        return skills
            .OrderBy(s => s.SkillName)
            .Select(s => new SkillOptionDto
            {
                Id = s.Id,
                SkillName = s.SkillName,
                DomainClassification = s.DomainClassification.ToString(),
            })
            .ToList();
    }

    public async Task<CompanyJobDto> CreateJobAsync(Guid companyId, CreateJobRequestDto dto, CancellationToken ct = default)
    {
        var locationType = ParseLocationType(dto.LocationType);
        ValidateDeadline(dto.DeadLine);
        var skills = await ValidateSkillsAsync(dto.RequiredSkills, ct);

        var job = new Job
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            Title = dto.Title.Trim(),
            CoreDescription = dto.CoreDescription.Trim(),
            SelectionCriteria = dto.SelectionCriteria?.Trim() ?? string.Empty,
            LocationType = locationType,
            DeadLine = dto.DeadLine,
            IsApproved = false,
            IsClosed = false,
            JobSkills = skills
                .Select(s => new JobSkill { SkillId = s.SkillId, RequiredImportanceWeight = s.Weight })
                .ToList(),
        };

        await _jobRepo.AddAsync(job, ct);
        // A single SaveChanges persists the Job and its JobSkills rows in one transaction.
        await _jobRepo.SaveChangesAsync(ct);

        var created = await _jobRepo.GetByIdWithSkillsAsync(job.Id, ct);
        return JobMapper.ToCompanyDto(created!);
    }

    public async Task<CompanyJobDto> UpdateJobAsync(Guid companyId, Guid jobId, CreateJobRequestDto dto, CancellationToken ct = default)
    {
        var job = await _jobRepo.GetTrackedByIdWithSkillsAsync(jobId, ct)
            ?? throw new KeyNotFoundException("Job not found.");

        // Ownership is checked before any field-level validation.
        if (job.CompanyId != companyId)
        {
            throw new ForbiddenActionException("You do not have permission to modify this job.");
        }

        var locationType = ParseLocationType(dto.LocationType);
        ValidateDeadline(dto.DeadLine);
        var skills = await ValidateSkillsAsync(dto.RequiredSkills, ct);

        job.Title = dto.Title.Trim();
        job.CoreDescription = dto.CoreDescription.Trim();
        job.SelectionCriteria = dto.SelectionCriteria?.Trim() ?? string.Empty;
        job.LocationType = locationType;
        job.DeadLine = dto.DeadLine;
        // Deliberately NOT resetting IsApproved: edits to an already-approved job stay approved
        // in this version. A stricter variant would re-queue significant edits for admin
        // re-approval (IsApproved = false) — a reasonable stretch goal if time allows.

        ReconcileJobSkills(job, skills);

        await _jobRepo.SaveChangesAsync(ct);

        var updated = await _jobRepo.GetByIdWithSkillsAsync(job.Id, ct);
        return JobMapper.ToCompanyDto(updated!);
    }

    public async Task<CompanyJobDto> CloseJobAsync(Guid companyId, Guid jobId, CancellationToken ct = default)
    {
        var job = await _jobRepo.GetTrackedByIdWithSkillsAsync(jobId, ct)
            ?? throw new KeyNotFoundException("Job not found.");

        if (job.CompanyId != companyId)
        {
            throw new ForbiddenActionException("You do not have permission to modify this job.");
        }

        job.IsClosed = true;
        await _jobRepo.SaveChangesAsync(ct);

        var closed = await _jobRepo.GetByIdWithSkillsAsync(job.Id, ct);
        return JobMapper.ToCompanyDto(closed!);
    }

    private static LocationType ParseLocationType(string value)
    {
        if (Enum.TryParse<LocationType>(value?.Trim(), ignoreCase: true, out var parsed) && Enum.IsDefined(parsed))
        {
            return parsed;
        }

        throw new ValidationFailedException("locationType", "Location type must be one of: Remote, OnSite, Hybrid.");
    }

    private static void ValidateDeadline(DateTimeOffset deadline)
    {
        if (deadline <= DateTimeOffset.UtcNow)
        {
            throw new ValidationFailedException("deadLine", "Deadline must be a future date.");
        }
    }

    private async Task<IReadOnlyList<JobSkillRequestDto>> ValidateSkillsAsync(
        List<JobSkillRequestDto> requested, CancellationToken ct)
    {
        if (requested is null || requested.Count == 0)
        {
            return [];
        }

        if (requested.GroupBy(s => s.SkillId).Any(g => g.Count() > 1))
        {
            throw new ValidationFailedException("requiredSkills", "Duplicate skillId entries are not allowed.");
        }

        var ids = requested.Select(s => s.SkillId).ToList();
        var existing = await _skillRepo.FindAsync(s => ids.Contains(s.Id), ct);
        if (existing.Count != ids.Count)
        {
            throw new ValidationFailedException("requiredSkills", "One or more skillId values do not exist.");
        }

        return requested;
    }

    // Reconciles the tracked job's skills against the requested set without deleting-and-
    // reinserting rows that share a composite key, which EF cannot do in a single SaveChanges.
    private static void ReconcileJobSkills(Job job, IReadOnlyList<JobSkillRequestDto> requested)
    {
        var targetWeights = requested.ToDictionary(s => s.SkillId, s => s.Weight);

        foreach (var existing in job.JobSkills.ToList())
        {
            if (targetWeights.TryGetValue(existing.SkillId, out var weight))
            {
                existing.RequiredImportanceWeight = weight;
            }
            else
            {
                job.JobSkills.Remove(existing);
            }
        }

        var currentIds = job.JobSkills.Select(js => js.SkillId).ToHashSet();
        foreach (var skill in requested)
        {
            if (!currentIds.Contains(skill.SkillId))
            {
                job.JobSkills.Add(new JobSkill
                {
                    JobId = job.Id,
                    SkillId = skill.SkillId,
                    RequiredImportanceWeight = skill.Weight,
                });
            }
        }
    }
}
