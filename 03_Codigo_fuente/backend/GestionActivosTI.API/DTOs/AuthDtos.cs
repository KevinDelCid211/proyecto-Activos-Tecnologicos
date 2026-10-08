using System.ComponentModel.DataAnnotations;

namespace GestionActivosTI.API.DTOs;

public record LoginRequest(
    [Required(ErrorMessage = "El correo es requerido"), EmailAddress] string Email,
    [Required(ErrorMessage = "La contraseña es requerida")] string Password);

public record LoginResponse(
    string Token,
    string Nombre,
    string Email,
    string Rol,
    DateTime Expiracion);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8, ErrorMessage = "La nueva contraseña debe tener al menos 8 caracteres")] string NewPassword);

public record VerificarPasswordRequest(
    [Required(ErrorMessage = "La contraseña es requerida")] string Password);
