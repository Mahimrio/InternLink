using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using InternLinkApi.Data;
using InternLinkApi.DTOs;
using InternLinkApi.Models;
using InternLinkApi.Models.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace InternLinkApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<User> _userManager;
    private readonly RoleManager<Role> _roleManager;
    private readonly ApplicationDbContext _db;
    private readonly IConfiguration _configuration;

    public AuthController(
        UserManager<User> userManager,
        RoleManager<Role> roleManager,
        ApplicationDbContext db,
        IConfiguration configuration)
    {
        _userManager = userManager;
        _roleManager = roleManager;
        _db = db;
        _configuration = configuration;
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
            EmailConfirmed = false,
            CreatedAt = DateTimeOffset.UtcNow,
            IsActive = true,
            RoleId = role.Id,
        };

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
            var student = new Student
            {
                UserId = user.Id,
                FirstName = dto.FirstName!,
                LastName = dto.LastName!,
            };
            _db.Students.Add(student);
        }
        else if (dto.Role == "Company")
        {
            var company = new Company
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

        if (await _userManager.IsLockedOutAsync(user))
        {
            return Unauthorized(new { error = "Account is locked out due to too many failed attempts. Try again later." });
        }

        if (!await _userManager.IsEmailConfirmedAsync(user))
        {
            return Unauthorized(new { error = "Email not confirmed. Please confirm your email before logging in." });
        }

        // OTP insertion point: Prompt 11 can insert a step here between credential
        // verification and token issuance without restructuring this method.
        return Ok(await IssueTokensAsync(user));
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

    private async Task<AuthResponseDto> IssueTokensAsync(User user, Guid? replacedTokenId = null)
    {
        var accessToken = GenerateAccessToken(user);
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
            Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? string.Empty,
        };
    }

    private string GenerateAccessToken(User user)
    {
        var secret = _configuration["Jwt:Secret"]
            ?? throw new InvalidOperationException("JWT secret is not configured.");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.Role, _userManager.GetRolesAsync(user).Result.FirstOrDefault() ?? string.Empty),
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
