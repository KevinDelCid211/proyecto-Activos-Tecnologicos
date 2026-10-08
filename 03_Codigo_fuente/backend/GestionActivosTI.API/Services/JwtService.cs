using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using GestionActivosTI.API.Models;
using Microsoft.IdentityModel.Tokens;

namespace GestionActivosTI.API.Services;

public interface IJwtService
{
    string    GenerateToken(Usuario usuario);
    DateTime  GetExpiration();
}

public class JwtService(IConfiguration config) : IJwtService
{
    private readonly IConfiguration _config = config;

    public string GenerateToken(Usuario usuario)
    {
        var settings   = _config.GetSection("JwtSettings");
        var key        = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings["SecretKey"]!));
        var creds      = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiration = GetExpiration();

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   usuario.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, usuario.Email),
            new Claim(ClaimTypes.Name,               usuario.Nombre),
            new Claim(ClaimTypes.Role,               usuario.Rol.Nombre),
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer:             settings["Issuer"],
            audience:           settings["Audience"],
            claims:             claims,
            expires:            expiration,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public DateTime GetExpiration()
    {
        var hours = int.Parse(_config["JwtSettings:ExpirationHours"] ?? "8");
        return DateTime.UtcNow.AddHours(hours);
    }
}
