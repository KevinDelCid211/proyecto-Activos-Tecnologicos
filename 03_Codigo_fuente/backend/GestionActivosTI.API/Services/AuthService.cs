using GestionActivosTI.API.Data;
using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Services;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<bool>           ChangePasswordAsync(int userId, string currentPwd, string newPwd);
    Task<bool>           VerificarPasswordAsync(int userId, string password);
}

public class AuthService(AppDbContext db, IJwtService jwt) : IAuthService
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var usuario = await db.Usuarios
            .Include(u => u.Rol)
            .FirstOrDefaultAsync(u => u.Email == request.Email && u.Activo);

        if (usuario is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(request.Password, usuario.PasswordHash)) return null;

        usuario.UltimoAcceso = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var expiracion = jwt.GetExpiration();
        var token      = jwt.GenerateToken(usuario);

        return new LoginResponse(token, usuario.Nombre, usuario.Email, usuario.Rol.Nombre, expiracion);
    }

    public async Task<bool> ChangePasswordAsync(int userId, string currentPwd, string newPwd)
    {
        var usuario = await db.Usuarios.FindAsync(userId);
        if (usuario is null) return false;
        if (!BCrypt.Net.BCrypt.Verify(currentPwd, usuario.PasswordHash)) return false;

        usuario.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPwd);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> VerificarPasswordAsync(int userId, string password)
    {
        var usuario = await db.Usuarios.FindAsync(userId);
        if (usuario is null) return false;
        return BCrypt.Net.BCrypt.Verify(password, usuario.PasswordHash);
    }
}
