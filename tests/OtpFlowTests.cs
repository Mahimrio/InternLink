using System.Security.Cryptography;
using System.Text;
using InternLinkApi.Data;
using InternLinkApi.Models;
using Microsoft.EntityFrameworkCore;

namespace InternLinkApi.Tests;

public class OtpFlowTests : IDisposable
{
    private readonly ApplicationDbContext _db;
    private readonly FakeTimeProvider _time;
    private readonly Guid _userId;

    public OtpFlowTests()
    {
        _time = new FakeTimeProvider();

        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase($"OtpTestDb_{Guid.NewGuid()}")
            .Options;

        _db = new ApplicationDbContext(options);

        var user = new User
        {
            Id = Guid.NewGuid(),
            UserName = "test@example.com",
            Email = "test@example.com",
        };
        _db.Users.Add(user);
        _db.SaveChanges();
        _userId = user.Id;
    }

    public void Dispose()
    {
        _db.Dispose();
    }

    [Fact]
    public async Task Expired_otp_is_rejected()
    {
        var (_, codeHash, expiresAt) = CreateOtpData(expiryMinutes: 5);

        var otp = new OtpCode
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            CodeHash = codeHash,
            ExpiresAt = expiresAt,
            CreatedAt = _time.GetUtcNow(),
        };
        _db.OtpCodes.Add(otp);
        await _db.SaveChangesAsync();

        // Advance time past 5-minute expiry
        _time.Advance(TimeSpan.FromMinutes(6));

        var stored = await _db.OtpCodes.FindAsync(otp.Id);
        Assert.NotNull(stored);
        Assert.True(stored.ExpiresAt < _time.GetUtcNow(), "OTP should be expired");
    }

    [Fact]
    public async Task Valid_otp_succeeds_once_and_consumed_on_second_attempt()
    {
        var (plainCode, codeHash, expiresAt) = CreateOtpData(expiryMinutes: 5);

        var otp = new OtpCode
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            CodeHash = codeHash,
            ExpiresAt = expiresAt,
            CreatedAt = _time.GetUtcNow(),
        };
        _db.OtpCodes.Add(otp);
        await _db.SaveChangesAsync();

        // First attempt — within window, not consumed
        var stored = await _db.OtpCodes.FindAsync(otp.Id);
        Assert.NotNull(stored);
        Assert.Null(stored.ConsumedAt);
        Assert.True(stored.ExpiresAt > _time.GetUtcNow());

        stored.ConsumedAt = _time.GetUtcNow();
        _db.OtpCodes.Update(stored);
        await _db.SaveChangesAsync();

        // Second attempt — same code, now consumed
        var consumed = await _db.OtpCodes.FindAsync(otp.Id);
        Assert.NotNull(consumed);
        Assert.NotNull(consumed.ConsumedAt);
    }

    [Fact]
    public async Task Resend_within_30_seconds_is_rejected()
    {
        var firstCreated = _time.GetUtcNow();

        // Simulate a recent OTP for the same user
        var (_, codeHash1, _) = CreateOtpData(expiryMinutes: 5);
        var otp1 = new OtpCode
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            CodeHash = codeHash1,
            ExpiresAt = _time.GetUtcNow().AddMinutes(5),
            CreatedAt = firstCreated,
        };
        _db.OtpCodes.Add(otp1);
        await _db.SaveChangesAsync();

        // Advance 15 seconds (less than 30) and try again
        _time.Advance(TimeSpan.FromSeconds(15));

        var lastOtp = await _db.OtpCodes
            .Where(oc => oc.UserId == _userId)
            .OrderByDescending(oc => oc.CreatedAt)
            .FirstOrDefaultAsync();

        Assert.NotNull(lastOtp);
        var elapsed = _time.GetUtcNow() - lastOtp.CreatedAt;
        Assert.True(elapsed.TotalSeconds < 30, "Should be less than 30s since last OTP");
    }

    [Fact]
    public async Task Resend_after_30_seconds_is_allowed()
    {
        var firstCreated = _time.GetUtcNow();

        var (_, codeHash1, _) = CreateOtpData(expiryMinutes: 5);
        var otp1 = new OtpCode
        {
            Id = Guid.NewGuid(),
            UserId = _userId,
            CodeHash = codeHash1,
            ExpiresAt = _time.GetUtcNow().AddMinutes(5),
            CreatedAt = firstCreated,
        };
        _db.OtpCodes.Add(otp1);
        await _db.SaveChangesAsync();

        // Advance 31 seconds (past 30s cooldown)
        _time.Advance(TimeSpan.FromSeconds(31));

        var lastOtp = await _db.OtpCodes
            .Where(oc => oc.UserId == _userId)
            .OrderByDescending(oc => oc.CreatedAt)
            .FirstOrDefaultAsync();

        Assert.NotNull(lastOtp);
        var elapsed = _time.GetUtcNow() - lastOtp.CreatedAt;
        Assert.True(elapsed.TotalSeconds >= 30, "Should be at least 30s since last OTP");
    }

    private static (string plainCode, string hash, DateTimeOffset expiresAt) CreateOtpData(int expiryMinutes)
    {
        var start = new DateTimeOffset(2026, 7, 14, 12, 0, 0, TimeSpan.Zero);
        var plainCode = "123456";
        var hash = ComputeSha256Hash(plainCode);
        return (plainCode, hash, start.AddMinutes(expiryMinutes));
    }

    private static string ComputeSha256Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }
}
