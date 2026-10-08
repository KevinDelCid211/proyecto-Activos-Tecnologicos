using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Models;
using GestionActivosTI.API.Services;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace GestionActivosTI.API.Tests.Services;

public class ResponsablesServiceTests
{
    private static ResponsableCreateDto BuildDto(string nombre = "Ana Martínez") => new()
    {
        Nombre = nombre,
        Area   = "Seguridad TI",
        Email  = "ana@test.gt"
    };

    [Fact]
    public async Task CreateAsync_CreaResponsableActivoPorDefecto()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);

        var responsable = await service.CreateAsync(BuildDto());

        Assert.True(responsable.Id > 0);
        Assert.True(responsable.Activo);
    }

    [Fact]
    public async Task GetAllAsync_FiltraPorActivo()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var r1 = await service.CreateAsync(BuildDto("Activo Uno"));
        var r2 = await service.CreateAsync(BuildDto("Activo Dos"));
        await service.DesactivarAsync(r2.Id, new DesactivarResponsableDto { Observacion = "Dejó la empresa" }, usuarioId: 1);

        var soloActivos = await service.GetAllAsync(activo: true);

        Assert.Single(soloActivos);
        Assert.Equal(r1.Id, soloActivos[0].Id);
    }

    [Fact]
    public async Task ReactivarAsync_MarcaActivoYGuardaElComentario()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var creado   = await service.CreateAsync(BuildDto());
        await service.DesactivarAsync(creado.Id, new DesactivarResponsableDto { Observacion = "Baja temporal" }, usuarioId: 1);

        var ok = await service.ReactivarAsync(creado.Id, "Regresó a la empresa", usuarioId: 1);

        Assert.True(ok);
        var reactivado = await service.GetByIdAsync(creado.Id);
        Assert.True(reactivado!.Activo);
        Assert.Contains("Regresó a la empresa", reactivado.Observaciones);
    }

    [Fact]
    public async Task ReactivarAsync_ConIdInexistente_DevuelveFalse()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);

        var ok = await service.ReactivarAsync(999, "N/A", usuarioId: 1);

        Assert.False(ok);
    }

    [Fact]
    public async Task UpdateAsync_ActualizaDatosDelResponsable()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var creado   = await service.CreateAsync(BuildDto());

        var ok = await service.UpdateAsync(creado.Id, new ResponsableCreateDto
        {
            Nombre = "Ana Martínez Actualizada", Area = "Seguridad TI", Email = "ana2@test.gt"
        });

        Assert.True(ok);
        var actualizado = await service.GetByIdAsync(creado.Id);
        Assert.Equal("Ana Martínez Actualizada", actualizado!.Nombre);
        Assert.Equal("ana2@test.gt", actualizado.Email);
    }

    [Fact]
    public async Task GetActivosAsignadosAsync_DevuelveSoloLosActivosConAsignacionActual()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var responsable = await service.CreateAsync(BuildDto());

        var activoAsignado = new Activo { Nombre = "Servidor Web", TipoActivoId = 1, Estado = "Activo", UsuarioCreadorId = 1 };
        var activoAnterior = new Activo { Nombre = "Laptop Vieja",  TipoActivoId = 1, Estado = "Retirado", UsuarioCreadorId = 1 };
        db.Activos.AddRange(activoAsignado, activoAnterior);
        await db.SaveChangesAsync();

        db.ActivoResponsables.AddRange(
            new ActivoResponsable { ActivoId = activoAsignado.Id, ResponsableId = responsable.Id, EsActual = true,  FechaInicio = DateOnly.FromDateTime(DateTime.Today), UsuarioAsignadorId = 1 },
            new ActivoResponsable { ActivoId = activoAnterior.Id, ResponsableId = responsable.Id, EsActual = false, FechaInicio = DateOnly.FromDateTime(DateTime.Today).AddMonths(-1), UsuarioAsignadorId = 1 });
        await db.SaveChangesAsync();

        var asignados = await service.GetActivosAsignadosAsync(responsable.Id);

        Assert.Single(asignados);
        Assert.Equal("Servidor Web", asignados[0].Nombre);
    }

    [Fact]
    public async Task GetActivosAsignadosAsync_SinAsignaciones_DevuelveListaVacia()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var responsable = await service.CreateAsync(BuildDto());

        var asignados = await service.GetActivosAsignadosAsync(responsable.Id);

        Assert.Empty(asignados);
    }

    [Fact]
    public async Task CreateAsync_GuardaContactoDeRespaldo()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);

        var dto = BuildDto();
        dto.ContactoRespaldoNombre = "Luis Sánchez";
        dto.ContactoRespaldoEmail  = "lsanchez@empresa.gt";

        var creado = await service.CreateAsync(dto);

        var leido = await service.GetByIdAsync(creado.Id);
        Assert.Equal("Luis Sánchez", leido!.ContactoRespaldoNombre);
        Assert.Equal("lsanchez@empresa.gt", leido.ContactoRespaldoEmail);
    }

    [Fact]
    public async Task DesactivarAsync_GuardaObservacionYMarcaInactivo()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var creado   = await service.CreateAsync(BuildDto());

        var ok = await service.DesactivarAsync(creado.Id,
            new DesactivarResponsableDto { Observacion = "Renunció a la empresa" }, usuarioId: 1);

        Assert.True(ok);
        var leido = await service.GetByIdAsync(creado.Id);
        Assert.False(leido!.Activo);
        Assert.Equal("Renunció a la empresa", leido.Observaciones);
    }

    [Fact]
    public async Task DesactivarAsync_SinResponsableDeReemplazo_DejaLosActivosSinResponsable()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var responsable = await service.CreateAsync(BuildDto());

        var activo = new Activo { Nombre = "Servidor Web", TipoActivoId = 1, Estado = "Activo", UsuarioCreadorId = 1 };
        db.Activos.Add(activo);
        await db.SaveChangesAsync();
        db.ActivoResponsables.Add(new ActivoResponsable
        {
            ActivoId = activo.Id, ResponsableId = responsable.Id, EsActual = true,
            FechaInicio = DateOnly.FromDateTime(DateTime.Today), UsuarioAsignadorId = 1
        });
        await db.SaveChangesAsync();

        await service.DesactivarAsync(responsable.Id,
            new DesactivarResponsableDto { Observacion = "Cambio de área" }, usuarioId: 1);

        var asignados = await service.GetActivosAsignadosAsync(responsable.Id);
        Assert.Empty(asignados);

        var historial = await db.HistorialCambios.Where(h => h.ActivoId == activo.Id).ToListAsync();
        Assert.Contains(historial, h => h.Descripcion.Contains("sin responsable"));
    }

    [Fact]
    public async Task DesactivarAsync_ConResponsableDeReemplazo_ReasignaLosActivos()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var responsableAnterior = await service.CreateAsync(BuildDto("Juan García"));
        var responsableNuevo    = await service.CreateAsync(BuildDto("María López"));

        var activo = new Activo { Nombre = "Servidor Web", TipoActivoId = 1, Estado = "Activo", UsuarioCreadorId = 1 };
        db.Activos.Add(activo);
        await db.SaveChangesAsync();
        db.ActivoResponsables.Add(new ActivoResponsable
        {
            ActivoId = activo.Id, ResponsableId = responsableAnterior.Id, EsActual = true,
            FechaInicio = DateOnly.FromDateTime(DateTime.Today), UsuarioAsignadorId = 1
        });
        await db.SaveChangesAsync();

        await service.DesactivarAsync(responsableAnterior.Id,
            new DesactivarResponsableDto { Observacion = "Vacaciones extendidas", NuevoResponsableId = responsableNuevo.Id },
            usuarioId: 1);

        var activosDelAnterior = await service.GetActivosAsignadosAsync(responsableAnterior.Id);
        var activosDelNuevo    = await service.GetActivosAsignadosAsync(responsableNuevo.Id);

        Assert.Empty(activosDelAnterior);
        Assert.Single(activosDelNuevo);
        Assert.Equal("Servidor Web", activosDelNuevo[0].Nombre);
    }

    [Fact]
    public async Task DesactivarAsync_ConIdInexistente_DevuelveFalse()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);

        var ok = await service.DesactivarAsync(999,
            new DesactivarResponsableDto { Observacion = "N/A" }, usuarioId: 1);

        Assert.False(ok);
    }

    [Fact]
    public async Task DesactivarAsync_SinActivosAsignados_IgualRegistraHistorialConElComentario()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var creado   = await service.CreateAsync(BuildDto());

        await service.DesactivarAsync(creado.Id,
            new DesactivarResponsableDto { Observacion = "Renunció a la empresa" }, usuarioId: 1);

        var historial = await db.HistorialCambios
            .Where(h => h.ResponsableId == creado.Id && h.TipoCambio == "BajaResponsable")
            .ToListAsync();

        Assert.Single(historial);
        Assert.Equal("Renunció a la empresa", historial[0].Descripcion);
        Assert.Null(historial[0].ActivoId);
    }

    [Fact]
    public async Task ReactivarAsync_SinActivosAsignados_IgualRegistraHistorialConElComentario()
    {
        using var db = TestDbContextFactory.Create();
        var service  = new ResponsablesService(db);
        var creado   = await service.CreateAsync(BuildDto());
        await service.DesactivarAsync(creado.Id, new DesactivarResponsableDto { Observacion = "Baja temporal" }, usuarioId: 1);

        await service.ReactivarAsync(creado.Id, "Regresó de sus vacaciones", usuarioId: 1);

        var historial = await db.HistorialCambios
            .Where(h => h.ResponsableId == creado.Id && h.TipoCambio == "ReactivacionResponsable")
            .ToListAsync();

        Assert.Single(historial);
        Assert.Equal("Regresó de sus vacaciones", historial[0].Descripcion);
        Assert.Null(historial[0].ActivoId);
    }
}
