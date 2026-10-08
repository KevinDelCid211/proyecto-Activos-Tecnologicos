using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Models;
using GestionActivosTI.API.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GestionActivosTI.API.Tests.Services;

public class ActivosServiceTests
{
    private static ActivoCreateDto BuildCreateDto(string nombre = "Servidor de Pruebas", string estado = "Activo") => new()
    {
        Nombre       = nombre,
        Codigo       = "SRV-TEST-001",
        TipoActivoId = 1,
        Estado       = estado,
        Ubicacion    = "DataCenter",
        DireccionIP  = "10.0.0.5"
    };

    [Fact]
    public async Task CreateAsync_CreaActivoYRegistraHistorialDeCreacion()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);

        var activo = await service.CreateAsync(BuildCreateDto(), usuarioId: 1);

        Assert.True(activo.Id > 0);
        var historial = await db.HistorialCambios.Where(h => h.ActivoId == activo.Id).ToListAsync();
        Assert.Single(historial);
        Assert.Equal("Creacion", historial[0].TipoCambio);
    }

    [Fact]
    public async Task GetAllAsync_FiltraPorEstado()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);
        await service.CreateAsync(BuildCreateDto("Activo A", "Activo"), 1);
        await service.CreateAsync(BuildCreateDto("Activo B", "Retirado"), 1);

        var resultado = await service.GetAllAsync(estado: "Retirado", tipoId: null, busqueda: null, page: 1, pageSize: 20);

        Assert.Single(resultado.Items);
        Assert.Equal("Activo B", resultado.Items[0].Nombre);
        Assert.Equal(1, resultado.TotalCount);
    }

    [Fact]
    public async Task GetAllAsync_FiltraPorBusquedaEnNombreCodigoOIp()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);
        await service.CreateAsync(BuildCreateDto("Servidor Web", "Activo"), 1);
        await service.CreateAsync(BuildCreateDto("Firewall Perimetral", "Activo"), 1);

        var resultado = await service.GetAllAsync(estado: null, tipoId: null, busqueda: "Web", page: 1, pageSize: 20);

        Assert.Single(resultado.Items);
        Assert.Equal("Servidor Web", resultado.Items[0].Nombre);
    }

    [Fact]
    public async Task GetAllAsync_DevuelvePaginaCorrectaYTotalCount()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);
        for (var i = 1; i <= 5; i++)
            await service.CreateAsync(BuildCreateDto($"Activo {i:00}"), 1);

        var pagina1 = await service.GetAllAsync(estado: null, tipoId: null, busqueda: null, page: 1, pageSize: 2);
        var pagina2 = await service.GetAllAsync(estado: null, tipoId: null, busqueda: null, page: 2, pageSize: 2);
        var pagina3 = await service.GetAllAsync(estado: null, tipoId: null, busqueda: null, page: 3, pageSize: 2);

        Assert.Equal(5, pagina1.TotalCount);
        Assert.Equal(3, pagina1.TotalPages);
        Assert.Equal(2, pagina1.Items.Count);
        Assert.Equal(2, pagina2.Items.Count);
        Assert.Single(pagina3.Items);

        // El orden es por Nombre, así que no debe haber solapamiento entre páginas
        Assert.Equal("Activo 01", pagina1.Items[0].Nombre);
        Assert.Equal("Activo 03", pagina2.Items[0].Nombre);
        Assert.Equal("Activo 05", pagina3.Items[0].Nombre);
    }

    [Fact]
    public async Task GetAllAsync_LimitaPageSizeMaximoA100()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);
        await service.CreateAsync(BuildCreateDto(), 1);

        var resultado = await service.GetAllAsync(estado: null, tipoId: null, busqueda: null, page: 1, pageSize: 999);

        Assert.Equal(100, resultado.PageSize);
    }

    [Fact]
    public async Task UpdateAsync_ConCambios_RegistraDescripcionDeCambiosEnHistorial()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);
        var activo   = await service.CreateAsync(BuildCreateDto(), 1);

        var dto = BuildCreateDto("Servidor Renombrado", "Mantenimiento");
        var ok  = await service.UpdateAsync(activo.Id, new ActivoUpdateDto
        {
            Nombre = dto.Nombre, Codigo = dto.Codigo, TipoActivoId = dto.TipoActivoId,
            Estado = dto.Estado, Ubicacion = dto.Ubicacion, DireccionIP = dto.DireccionIP
        }, usuarioId: 1);

        Assert.True(ok);
        var actualizado = await db.Activos.FindAsync(activo.Id);
        Assert.Equal("Servidor Renombrado", actualizado!.Nombre);
        Assert.Equal("Mantenimiento", actualizado.Estado);
        Assert.NotNull(actualizado.FechaModificacion);

        var historial = await db.HistorialCambios
            .Where(h => h.ActivoId == activo.Id && h.TipoCambio == "Modificacion")
            .ToListAsync();
        Assert.Single(historial);
        Assert.Contains("Nombre:", historial[0].Descripcion);
        Assert.Contains("Estado:", historial[0].Descripcion);
    }

    [Fact]
    public async Task UpdateAsync_ConIdInexistente_DevuelveFalse()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);

        var ok = await service.UpdateAsync(999, new ActivoUpdateDto { Nombre = "X", TipoActivoId = 1, Estado = "Activo" }, 1);

        Assert.False(ok);
    }

    [Fact]
    public async Task DeleteAsync_HaceBorradoLogico_MarcandoEstadoRetirado()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);
        var activo   = await service.CreateAsync(BuildCreateDto(), 1);

        var ok = await service.DeleteAsync(activo.Id);

        Assert.True(ok);
        var eliminado = await db.Activos.FindAsync(activo.Id);
        Assert.NotNull(eliminado);
        Assert.Equal("Retirado", eliminado!.Estado);
    }

    [Fact]
    public async Task CambiarEstadoAsync_RegistraValorAnteriorYNuevoEnHistorial()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ActivosService(db);
        var activo   = await service.CreateAsync(BuildCreateDto(estado: "Activo"), 1);

        var ok = await service.CambiarEstadoAsync(activo.Id, "Mantenimiento", usuarioId: 1);

        Assert.True(ok);
        var actualizado = await db.Activos.FindAsync(activo.Id);
        Assert.Equal("Mantenimiento", actualizado!.Estado);

        var cambio = await db.HistorialCambios
            .Where(h => h.ActivoId == activo.Id && h.TipoCambio == "CambioEstado")
            .SingleAsync();
        Assert.Equal("Activo", cambio.ValorAnterior);
        Assert.Equal("Mantenimiento", cambio.ValorNuevo);
    }

    [Fact]
    public async Task AsignarResponsableAsync_PrimeraAsignacion_QuedaComoActual()
    {
        using var db = TestDbContextFactory.Create();
        db.Responsables.Add(new Responsable { Id = 1, Nombre = "Juan García", Area = "Infraestructura", Email = "jg@test.gt" });
        await db.SaveChangesAsync();

        var service = new ActivosService(db);
        var activo  = await service.CreateAsync(BuildCreateDto(), 1);

        var ok = await service.AsignarResponsableAsync(new AsignarResponsableDto
        {
            ActivoId = activo.Id, ResponsableId = 1, FechaInicio = DateOnly.FromDateTime(DateTime.Today)
        }, usuarioId: 1);

        Assert.True(ok);
        var asignacion = await db.ActivoResponsables.SingleAsync(ar => ar.ActivoId == activo.Id);
        Assert.True(asignacion.EsActual);
    }

    [Fact]
    public async Task AsignarResponsableAsync_ConAsignacionPrevia_MarcaLaAnteriorComoNoActual()
    {
        using var db = TestDbContextFactory.Create();
        db.Responsables.AddRange(
            new Responsable { Id = 1, Nombre = "Juan García", Area = "Infraestructura", Email = "jg@test.gt" },
            new Responsable { Id = 2, Nombre = "María López", Area = "Bases de Datos", Email = "ml@test.gt" });
        await db.SaveChangesAsync();

        var service = new ActivosService(db);
        var activo  = await service.CreateAsync(BuildCreateDto(), 1);

        var fechaInicial = DateOnly.FromDateTime(DateTime.Today).AddMonths(-1);
        await service.AsignarResponsableAsync(new AsignarResponsableDto
        {
            ActivoId = activo.Id, ResponsableId = 1, FechaInicio = fechaInicial
        }, 1);

        var fechaNueva = DateOnly.FromDateTime(DateTime.Today);
        await service.AsignarResponsableAsync(new AsignarResponsableDto
        {
            ActivoId = activo.Id, ResponsableId = 2, FechaInicio = fechaNueva
        }, 1);

        var asignaciones = await db.ActivoResponsables.Where(ar => ar.ActivoId == activo.Id).ToListAsync();
        Assert.Equal(2, asignaciones.Count);

        var anterior = asignaciones.Single(ar => ar.ResponsableId == 1);
        var actual   = asignaciones.Single(ar => ar.ResponsableId == 2);

        Assert.False(anterior.EsActual);
        Assert.NotNull(anterior.FechaFin);
        Assert.True(actual.EsActual);
    }
}
