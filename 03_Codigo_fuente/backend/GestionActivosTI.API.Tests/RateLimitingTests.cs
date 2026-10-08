using System.Net;
using System.Net.Http.Json;
using GestionActivosTI.API.Data;
using GestionActivosTI.API.DTOs;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace GestionActivosTI.API.Tests;

// No usa IClassFixture: cada prueba necesita su propio host (y por lo tanto
// su propio contador de rate limiting) para no interferir entre sí, ya que
// xUnit crea una instancia nueva de la clase de prueba por cada [Fact].
public class RateLimitingTests : IDisposable
{
    private readonly WebApplicationFactory<Program> _factory;

    public RateLimitingTests()
    {
        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(options =>
                    options.UseInMemoryDatabase(Guid.NewGuid().ToString()));
            });
        });
    }

    public void Dispose() => _factory.Dispose();

    [Fact]
    public async Task Login_TrasSuperarElLimiteDeIntentos_Devuelve429()
    {
        var client  = _factory.CreateClient();
        var request = new LoginRequest("noexiste@test.gt", "PasswordIncorrecta");

        HttpResponseMessage? ultimaRespuesta = null;
        for (var i = 0; i < 6; i++)
            ultimaRespuesta = await client.PostAsJsonAsync("/api/auth/login", request);

        Assert.Equal(HttpStatusCode.TooManyRequests, ultimaRespuesta!.StatusCode);
    }

    [Fact]
    public async Task Login_DentroDelLimite_NoEsBloqueado()
    {
        var client  = _factory.CreateClient();
        var request = new LoginRequest("noexiste@test.gt", "PasswordIncorrecta");

        for (var i = 0; i < 5; i++)
        {
            var respuesta = await client.PostAsJsonAsync("/api/auth/login", request);
            Assert.Equal(HttpStatusCode.Unauthorized, respuesta.StatusCode);
        }
    }
}
