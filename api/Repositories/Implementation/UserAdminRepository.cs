using InternLinkApi.Data;
using InternLinkApi.Models;
using InternLinkApi.Repositories.Interface;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Repositories.Implementation;

public class UserAdminRepository : IUserAdminRepository
{
    private readonly ApplicationDbContext _db;

    public UserAdminRepository(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<(IReadOnlyList<User> Items, int TotalCount)> GetPagedAsync(
        string? role, string? search, int page, int pageSize, CancellationToken ct = default)
    {
        var query = _db.Users
            .Include(u => u.Role)
            .Include(u => u.Student)
            .Include(u => u.Company)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(role))
        {
            query = query.Where(u => u.Role.Name == role);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var pattern = $"%{search.Trim()}%";
            query = query.Where(u =>
                EF.Functions.ILike(u.Email!, pattern)
                || (u.Student != null && EF.Functions.ILike(u.Student.FirstName + " " + u.Student.LastName, pattern))
                || (u.Company != null && EF.Functions.ILike(u.Company.CompanyName, pattern)));
        }

        var totalCount = await query.CountAsync(ct);

        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 20 : (pageSize > 100 ? 100 : pageSize);

        var items = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync(ct);

        return (items, totalCount);
    }

    public async Task<User?> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        return await _db.Users.FirstOrDefaultAsync(u => u.Id == id, ct);
    }

    public async Task RevokeAllRefreshTokensAsync(Guid userId, CancellationToken ct = default)
    {
        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
        }
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => _db.SaveChangesAsync(ct);
}
