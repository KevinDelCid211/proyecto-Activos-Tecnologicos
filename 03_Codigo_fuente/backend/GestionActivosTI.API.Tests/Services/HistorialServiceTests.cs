using GestionActivosTI.API.Models;
using GestionActivosTI.API.Services;
using Xunit;

namespace GestionActivosTI.API.Tests.Services;

public class HistorialServiceTests
{
    private static async Task SeedActivoConCambios(GestionActivosTI.API.Data.AppDbContext db, int cantidadCambios)
    {
        var tipoActivo = await db.TiposActivo.FindAsync(1);
        var activo = new Activo
        {
            Nombre = "Servidor de Pruebas", TipoActivoId = 1, Estado = "Activo", UsuarioCreadorId = 1
        };
        db.Activos.Add(activo);
        await db.SaveChangesAsync();

        for (var i = 0; i < cantidadCambios; i++)
        {
            db.HistorialCambios.Add(new HistorialCambio
            {
                ActivoId    = activo.Id,
                TipoCambio  = "Modificacion",
                Descripcion = $"Cambio número {i}",
                UsuarioId   = 1,
                FechaCambio = DateTime.UtcNow.AddMinutes(i)
            });
        }
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetRecenteAsync_DevuelvePaginaOrdenadaDescendentePorFecha()
    {
        using var db = TestDbContextFactory.Create();
        await SeedActivoConCambios(db, 5);
        var service = new HistorialService(db);

        var pagina1 = await service.GetRecenteAsync(page: 1, pageSize: 2, categoria: null);

        Assert.Equal(5, pagina1.TotalCount);
        Assert.Equal(2, pagina1.Items.Count);
        Assert.Contains("4", pagina1.Items[0].Descripcion);
        Assert.Contains("3", pagina1.Items[1].Descripcion);
    }

    [Fact]
    public async Task GetRecenteAsync_SegundaPagina_NoRepiteElementosDeLaPrimera()
    {
        using var db = TestDbContextFactory.Create();
        await SeedActivoConCambios(db, 5);
        var service = new HistorialService(db);

        var pagina1 = await service.GetRecenteAsync(page: 1, pageSize: 2, categoria: null);
        var pagina2 = await service.GetRecenteAsync(page: 2, pageSize: 2, categoria: null);

        var idsPagina1 = pagina1.Items.Select(h => h.Id).ToHashSet();
        var idsPagina2 = pagina2.Items.Select(h => h.Id).ToHashSet();

        Assert.Empty(idsPagina1.Intersect(idsPagina2));
    }

    [Fact]
    public async Task GetRecenteAsync_ConPageMenorA1_LoNormalizaA1()
    {
        using var db = TestDbContextFactory.Create();
        await SeedActivoConCambios(db, 3);
        var service = new HistorialService(db);

        var resultado = await service.GetRecenteAsync(page: 0, pageSize: 20, categoria: null);

        Assert.Equal(1, resultado.Page);
    }

    private static async Task SeedCambioAsignacionResponsable(GestionActivosTI.API.Data.AppDbContext db, int activoId)
    {
        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId    = activoId,
            TipoCambio  = "AsignacionResponsable",
            Descripcion = "Responsable asignado: Juan García",
            UsuarioId   = 1,
            FechaCambio = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetRecenteAsync_ConCategoriaResponsables_SoloDevuelveAsignacionResponsable()
    {
        using var db = TestDbContextFactory.Create();
        var activo = new Activo { Nombre = "Servidor", TipoActivoId = 1, Estado = "Activo", UsuarioCreadorId = 1 };
        db.Activos.Add(activo);
        await db.SaveChangesAsync();

        await SeedActivoConCambios(db, 2);
        await SeedCambioAsignacionResponsable(db, activo.Id);
        var service = new HistorialService(db);

        var resultado = await service.GetRecenteAsync(page: 1, pageSize: 20, categoria: "responsables");

        Assert.Single(resultado.Items);
        Assert.Equal("AsignacionResponsable", resultado.Items[0].TipoCambio);
    }

    [Fact]
    public async Task GetRecenteAsync_ConCategoriaActivos_ExcluyeAsignacionResponsable()
    {
        using var db = TestDbContextFactory.Create();
        var activo = new Activo { Nombre = "Servidor", TipoActivoId = 1, Estado = "Activo", UsuarioCreadorId = 1 };
        db.Activos.Add(activo);
        await db.SaveChangesAsync();

        await SeedActivoConCambios(db, 2);
        await SeedCambioAsignacionResponsable(db, activo.Id);
        var service = new HistorialService(db);

        var resultado = await service.GetRecenteAsync(page: 1, pageSize: 20, categoria: "activos");

        Assert.Equal(2, resultado.TotalCount);
        Assert.All(resultado.Items, h => Assert.NotEqual("AsignacionResponsable", h.TipoCambio));
    }

    private static async Task SeedCambioResponsableSinActivo(
        GestionActivosTI.API.Data.AppDbContext db, int responsableId, string tipoCambio, string descripcion)
    {
        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId      = null,
            ResponsableId = responsableId,
            TipoCambio    = tipoCambio,
            Descripcion   = descripcion,
            UsuarioId     = 1,
            FechaCambio   = DateTime.UtcNow
        });
        await db.SaveChangesAsync();
    }

    [Fact]
    public async Task GetRecenteAsync_ConCambioDeResponsableSinActivo_NoFalla_YTraeElNombreDelResponsable()
    {
        using var db = TestDbContextFactory.Create();
        var responsable = new Responsable { Nombre = "Ana Martínez", Area = "Seguridad TI", Email = "ana@test.gt" };
        db.Responsables.Add(responsable);
        await db.SaveChangesAsync();

        await SeedCambioResponsableSinActivo(db, responsable.Id, "BajaResponsable", "Renunció a la empresa");
        var service = new HistorialService(db);

        var resultado = await service.GetRecenteAsync(page: 1, pageSize: 20, categoria: null);

        Assert.Single(resultado.Items);
        Assert.Null(resultado.Items[0].ActivoId);
        Assert.Null(resultado.Items[0].NombreActivo);
        Assert.Equal("Ana Martínez", resultado.Items[0].NombreResponsable);
    }

    [Fact]
    public async Task GetRecenteAsync_ConCategoriaResponsables_IncluyeBajaYReactivacion()
    {
        using var db = TestDbContextFactory.Create();
        var responsable = new Responsable { Nombre = "Ana Martínez", Area = "Seguridad TI", Email = "ana@test.gt" };
        db.Responsables.Add(responsable);
        await db.SaveChangesAsync();

        await SeedActivoConCambios(db, 2);
        await SeedCambioResponsableSinActivo(db, responsable.Id, "BajaResponsable", "Renunció a la empresa");
        await SeedCambioResponsableSinActivo(db, responsable.Id, "ReactivacionResponsable", "Regresó a la empresa");
        var service = new HistorialService(db);

        var resultado = await service.GetRecenteAsync(page: 1, pageSize: 20, categoria: "responsables");

        Assert.Equal(2, resultado.TotalCount);
        Assert.All(resultado.Items, h => Assert.Contains(h.TipoCambio, new[] { "BajaResponsable", "ReactivacionResponsable" }));
    }
}
