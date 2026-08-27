using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Services.EmailSender;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StudentModel = InternLinkApi.Models.Student;
using CompanyModel = InternLinkApi.Models.Company;

namespace InternLinkApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _emailSender;

    public AuthController(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        ApplicationDbContext db,
        IConfiguration configuration,
        IEmailSender emailSender)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
        _configuration = configuration;
        _emailSender = emailSender;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Validation failed.", details = ModelState });

        if (dto.Role == "Student" && (string.IsNullOrWhiteSpace(dto.FirstName) || string.IsNullOrWhiteSpace(dto.LastName)))
            return BadRequest(new { error = "FirstName and LastName are required for Student role." });

        if (dto.Role == "Company" && string.IsNullOrWhiteSpace(dto.CompanyName))
            return BadRequest(new { error = "CompanyName is required for Company role." });

        if (await _userManager.FindByEmailAsync(dto.Email) is not null)
            return Conflict(new { error = "A user with this email already exists." });

        var role = await _roleManager.FindByNameAsync(dto.Role);
        if (role is null)
            return BadRequest(new { error = $"Role '{dto.Role}' not found." });

        var user = new User
        {
            UserName = dto.Email,
            Email = dto.Email,
            EmailConfirmed = true,
            CreatedAt = DateTimeOffset.UtcNow,
            IsActive = true,
            RoleId = role.Id,
        };

        // A retrying execution strategy is configured, so user-initiated transactions must
        // be wrapped in ExecuteAsync so the whole unit can be safely retried on transient failure.
        var strategy = _db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync<IActionResult>(async () =>
        {
            using var transaction = await _db.Database.BeginTransactionAsync();

            var createResult = await _userManager.CreateAsync(user, dto.Password);
            if (!createResult.Succeeded)
            {
                var errors = string.Join("; ", createResult.Errors.Select(e => e.Description));
                return BadRequest(new { error = errors });
            }

            await _userManager.AddToRoleAsync(user, dto.Role);

            if (dto.Role == "Student")
            {
                var student = new StudentModel
                {
                    UserId = user.Id,
                    FirstName = dto.FirstName!,
                    LastName = dto.LastName!,
                    InstitutionalId = Guid.NewGuid().ToString() // Temporary unique ID
                };
                _db.Students.Add(student);
            }
            else if (dto.Role == "Company")
            {
                var company = new CompanyModel
                {
                    UserId = user.Id,
                    CompanyName = dto.CompanyName!,
                    IndustrySector = string.Empty,
                };
                _db.Companies.Add(company);
            }

            await _db.SaveChangesAsync();
            await transaction.CommitAsync();

            return Created(string.Empty, new { userId = user.Id.ToString() });
        });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Validation failed.", details = ModelState });

        var user = await _userManager.FindByEmailAsync(dto.Email);
        if (user is null || !await _userManager.CheckPasswordAsync(user, dto.Password))
        {
            return Unauthorized(new { error = "Invalid email or password." });
        }

        // Suspended accounts are stopped before the OTP/token-issuance step.
        if (!user.IsActive)
        {
            return StatusCode(403, new { error = "This account has been suspended" });
        }

        if (await _userManager.IsLockedOutAsync(user))
        {
            return Unauthorized(new { error = "Account is locked out due to too many failed attempts. Try again later." });
        }

        if (!await _userManager.IsEmailConfirmedAsync(user))
        {
            return Unauthorized(new { error = "Email not confirmed. Please confirm your email before logging in." });
        }

        var (otpToken, plainCode) = await GenerateAndStoreOtpAsync(user);

        Console.WriteLine($"[DEBUG OTP] Verification code for {user.Email}: {plainCode}");

        await _emailSender.SendAsync(
            user.Email!,
            "Your InternLink verification code",
            $"""
            <p>Your verification code is:</p>
            <h2 style="font-size: 28px; letter-spacing: 4px; text-align: center;">{plainCode}</h2>
            <p>This code expires in 5 minutes.</p>
            """);

        return Accepted(new { otpRequired = true, otpToken, debugOtp = plainCode });
    }

    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Validation failed.", details = ModelState });

        var codeHash = ComputeSha256Hash(dto.Code);
        var otpCode = await _db.OtpCodes
            .Include(oc => oc.User)
            .FirstOrDefaultAsync(oc => oc.Id == Guid.Parse(dto.OtpToken));

        if (otpCode is null || otpCode.CodeHash != codeHash)
            return Unauthorized(new { error = "Invalid or expired code." });

        if (otpCode.ExpiresAt < DateTimeOffset.UtcNow)
            return Unauthorized(new { error = "Invalid or expired code." });

        if (otpCode.ConsumedAt is not null)
            return Unauthorized(new { error = "Invalid or expired code." });

        otpCode.ConsumedAt = DateTimeOffset.UtcNow;
        _db.OtpCodes.Update(otpCode);
        await _db.SaveChangesAsync();

        return Ok(await IssueTokensAsync(otpCode.User));
    }

    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Validation failed.", details = ModelState });

        var otpCode = await _db.OtpCodes
            .Include(oc => oc.User)
            .FirstOrDefaultAsync(oc => oc.Id == Guid.Parse(dto.OtpToken));

        if (otpCode is null || otpCode.ConsumedAt is not null)
            return Unauthorized(new { error = "Invalid or expired session." });

        var user = otpCode.User;

        // Rate limit: max 1 resend per 30 seconds per user
        var lastOtp = await _db.OtpCodes
            .Where(oc => oc.UserId == user.Id)
            .OrderByDescending(oc => oc.CreatedAt)
            .FirstOrDefaultAsync();

        if (lastOtp is not null)
        {
            var elapsed = DateTimeOffset.UtcNow - lastOtp.CreatedAt;
            if (elapsed.TotalSeconds < 30)
            {
                Response.Headers.RetryAfter = ((int)(30 - elapsed.TotalSeconds)).ToString();
                return StatusCode(429, new { error = "Please wait before requesting a new code." });
            }
        }

        // Invalidate previous code
        otpCode.ConsumedAt = DateTimeOffset.UtcNow;
        _db.OtpCodes.Update(otpCode);

        var (newOtpToken, plainCode) = await GenerateAndStoreOtpAsync(user);

        await _emailSender.SendAsync(
            user.Email!,
            "Your InternLink verification code",
            $"""
            <p>Your verification code is:</p>
            <h2 style="font-size: 28px; letter-spacing: 4px; text-align: center;">{plainCode}</h2>
            <p>This code expires in 5 minutes.</p>
            """);

        Console.WriteLine($"[DEBUG OTP] Resent verification code for {user.Email}: {plainCode}");

        return Accepted(new { otpRequired = true, otpToken = newOtpToken, debugOtp = plainCode });
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Validation failed.", details = ModelState });

        var tokenHash = ComputeSha256Hash(dto.RefreshToken);
        var storedToken = await _db.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken is null)
            return Unauthorized(new { error = "Invalid refresh token." });

        if (storedToken.RevokedAt is not null)
        {
            await RevokeRefreshTokenChainAsync(storedToken.UserId);
            return Unauthorized(new { error = "Refresh token has been revoked." });
        }

        if (storedToken.ExpiresAt < DateTimeOffset.UtcNow)
            return Unauthorized(new { error = "Refresh token has expired." });

        storedToken.RevokedAt = DateTimeOffset.UtcNow;
        _db.RefreshTokens.Update(storedToken);

        var user = storedToken.User;
        var response = await IssueTokensAsync(user, replacedTokenId: storedToken.Id);

        return Ok(response);
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout([FromBody] RefreshRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(new { error = "Validation failed.", details = ModelState });

        var tokenHash = ComputeSha256Hash(dto.RefreshToken);
        var storedToken = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);

        if (storedToken is not null && storedToken.RevokedAt is null)
        {
            storedToken.RevokedAt = DateTimeOffset.UtcNow;
            _db.RefreshTokens.Update(storedToken);
            await _db.SaveChangesAsync();
        }

        return Ok(new { message = "Logged out successfully." });
    }

    private async Task<(string otpToken, string plainCode)> GenerateAndStoreOtpAsync(User user)
    {
        var plainCode = GenerateOtpCode();
        var codeHash = ComputeSha256Hash(plainCode);

        var otpCode = new OtpCode
        {
            UserId = user.Id,
            CodeHash = codeHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5),
            CreatedAt = DateTimeOffset.UtcNow,
        };

        _db.OtpCodes.Add(otpCode);
        await _db.SaveChangesAsync();

        return (otpCode.Id.ToString(), plainCode);
    }

    private static string GenerateOtpCode()
    {
        var bytes = new byte[4];
        RandomNumberGenerator.Fill(bytes);
        var val = BitConverter.ToUInt32(bytes, 0) % 1_000_000;
        return val.ToString("D6");
    }

    private async Task<AuthResponseDto> IssueTokensAsync(User user, Guid? replacedTokenId = null)
    {
        var role = await ResolveRoleAsync(user);
        var accessToken = GenerateAccessToken(user, role);
        var (refreshTokenValue, refreshTokenHash) = GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7),
            CreatedAt = DateTimeOffset.UtcNow,
            ReplacedByTokenId = null,
        };

        if (replacedTokenId.HasValue)
            refreshToken.ReplacedByTokenId = replacedTokenId;

        _db.RefreshTokens.Add(refreshToken);
        await _db.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenValue,
            ExpiresInSeconds = 900,
            Role = role,
        };
    }

    // Prefer the Identity user-role join; fall back to the custom RoleId FK, which is always
    // set at registration/seed even when the join row is missing (as with the seeded admin).
    private async Task<string> ResolveRoleAsync(User user)
    {
        var role = (await _userManager.GetRolesAsync(user)).FirstOrDefault();
        if (!string.IsNullOrEmpty(role))
            return role;

        var fallback = await _roleManager.FindByIdAsync(user.RoleId.ToString());
        return fallback?.Name ?? string.Empty;
    }

    private string GenerateAccessToken(User user, string role)
    {
        var secret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT secret is not configured.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Role, role),
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"] ?? "InternLinkApi",
            audience: _configuration["Jwt:Audience"] ?? "InternLinkWeb",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static (string rawToken, string hash) GenerateRefreshToken()
    {
        var randomBytes = new byte[32];
        RandomNumberGenerator.Fill(randomBytes);
        var rawToken = Convert.ToBase64String(randomBytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
        var hash = ComputeSha256Hash(rawToken);
        return (rawToken, hash);
    }

    private static string ComputeSha256Hash(string value)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private async Task RevokeRefreshTokenChainAsync(Guid userId)
    {
        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == userId && rt.RevokedAt == null)
            .ToListAsync();

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTimeOffset.UtcNow;
        }

        await _db.SaveChangesAsync();
    }
}
