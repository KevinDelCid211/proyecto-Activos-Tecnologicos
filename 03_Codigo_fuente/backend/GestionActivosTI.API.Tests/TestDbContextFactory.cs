using GestionActivosTI.API.Data;
using GestionActivosTI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Tests;

public static class TestDbContextFactory
{
    public static AppDbContext Create()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;

        var db = new AppDbContext(options);

        var rolAdmin   = new Rol { Id = 1, Nombre = "Admin", Descripcion = "Administrador" };
        var rolUsuario = new Rol { Id = 2, Nombre = "Usuario", Descripcion = "Usuario estándar" };
        db.Roles.AddRange(rolAdmin, rolUsuario);

        db.Usuarios.Add(new Usuario
        {
            Id           = 1,
            Nombre       = "Admin Test",
            Email        = "admin@test.gt",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@2024"),
            RolId        = 1,
            Rol          = rolAdmin,
            Activo       = true
        });

        db.Usuarios.Add(new Usuario
        {
            Id           = 2,
            Nombre       = "Usuario Inactivo",
            Email        = "inactivo@test.gt",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@2024"),
            RolId        = 2,
            Rol          = rolUsuario,
            Activo       = false
        });

        var tipoServidor = new TipoActivo { Id = 1, Nombre = "Servidor", Icono = "dns", Activo = true };
        db.TiposActivo.Add(tipoServidor);

        db.SaveChanges();
        return db;
    }
}
