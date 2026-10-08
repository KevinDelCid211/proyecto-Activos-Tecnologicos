using System.Security.Claims;
using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace GestionActivosTI.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    [EnableRateLimiting("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        if (result is null)
            return Unauthorized(new { message = "Credenciales incorrectas" });

        return Ok(result);
    }

    [Authorize]
    [HttpPost("cambiar-password")]
    public async Task<IActionResult> CambiarPassword([FromBody] ChangePasswordRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var ok     = await authService.ChangePasswordAsync(userId, request.CurrentPassword, request.NewPassword);
        return ok ? Ok(new { message = "Contraseña actualizada" }) : BadRequest(new { message = "Contraseña actual incorrecta" });
    }

    [Authorize]
    [HttpPost("verificar-password")]
    public async Task<IActionResult> VerificarPassword([FromBody] VerificarPasswordRequest request)
    {
        var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");
        var valida = await authService.VerificarPasswordAsync(userId, request.Password);
        return valida ? Ok(new { message = "Contraseña válida" }) : Unauthorized(new { message = "Contraseña incorrecta" });
    }

    [Authorize]
    [HttpGet("me")]
    public IActionResult Me()
    {
        return Ok(new
        {
            id     = User.FindFirstValue(ClaimTypes.NameIdentifier),
            nombre = User.FindFirstValue(ClaimTypes.Name),
            email  = User.FindFirstValue(ClaimTypes.Email),
            rol    = User.FindFirstValue(ClaimTypes.Role)
        });
    }
}
