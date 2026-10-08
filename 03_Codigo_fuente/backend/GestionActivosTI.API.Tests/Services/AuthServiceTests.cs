using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace GestionActivosTI.API.Tests.Services;

public class AuthServiceTests
{
    private static IJwtService BuildJwtService()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:SecretKey"]        = "clave-de-prueba-super-secreta-1234567890",
                ["JwtSettings:Issuer"]            = "GestionActivosTI.Tests",
                ["JwtSettings:Audience"]          = "GestionActivosTI.Tests",
                ["JwtSettings:ExpirationHours"]   = "8"
            })
            .Build();

        return new JwtService(config);
    }

    [Fact]
    public async Task LoginAsync_ConCredencialesCorrectas_DevuelveToken()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var result = await service.LoginAsync(new LoginRequest("admin@test.gt", "Admin@2024"));

        Assert.NotNull(result);
        Assert.False(string.IsNullOrWhiteSpace(result!.Token));
        Assert.Equal("Admin", result.Rol);
    }

    [Fact]
    public async Task LoginAsync_ConPasswordIncorrecta_DevuelveNull()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var result = await service.LoginAsync(new LoginRequest("admin@test.gt", "PasswordIncorrecta"));

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_ConEmailInexistente_DevuelveNull()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var result = await service.LoginAsync(new LoginRequest("no-existe@test.gt", "Admin@2024"));

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_ConUsuarioInactivo_DevuelveNull()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var result = await service.LoginAsync(new LoginRequest("inactivo@test.gt", "Admin@2024"));

        Assert.Null(result);
    }

    [Fact]
    public async Task LoginAsync_ActualizaUltimoAcceso()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        await service.LoginAsync(new LoginRequest("admin@test.gt", "Admin@2024"));

        var usuario = await db.Usuarios.FindAsync(1);
        Assert.NotNull(usuario!.UltimoAcceso);
    }

    [Fact]
    public async Task ChangePasswordAsync_ConPasswordActualCorrecta_ActualizaHash()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var ok = await service.ChangePasswordAsync(1, "Admin@2024", "NuevaPassword123");

        Assert.True(ok);
        var usuario = await db.Usuarios.FindAsync(1);
        Assert.True(BCrypt.Net.BCrypt.Verify("NuevaPassword123", usuario!.PasswordHash));
    }

    [Fact]
    public async Task ChangePasswordAsync_ConPasswordActualIncorrecta_NoActualiza()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var ok = await service.ChangePasswordAsync(1, "PasswordIncorrecta", "NuevaPassword123");

        Assert.False(ok);
        var usuario = await db.Usuarios.FindAsync(1);
        Assert.True(BCrypt.Net.BCrypt.Verify("Admin@2024", usuario!.PasswordHash));
    }

    [Fact]
    public async Task ChangePasswordAsync_ConUsuarioInexistente_DevuelveFalse()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var ok = await service.ChangePasswordAsync(999, "Admin@2024", "NuevaPassword123");

        Assert.False(ok);
    }

    [Fact]
    public async Task VerificarPasswordAsync_ConPasswordCorrecta_DevuelveTrue()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var ok = await service.VerificarPasswordAsync(1, "Admin@2024");

        Assert.True(ok);
    }

    [Fact]
    public async Task VerificarPasswordAsync_ConPasswordIncorrecta_DevuelveFalse()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var ok = await service.VerificarPasswordAsync(1, "PasswordIncorrecta");

        Assert.False(ok);
    }

    [Fact]
    public async Task VerificarPasswordAsync_ConUsuarioInexistente_DevuelveFalse()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new AuthService(db, BuildJwtService());

        var ok = await service.VerificarPasswordAsync(999, "Admin@2024");

        Assert.False(ok);
    }
}
