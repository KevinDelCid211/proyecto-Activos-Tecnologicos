using GestionActivosTI.API.Data;
using GestionActivosTI.API.Models;
using GestionActivosTI.API.Services;
using Xunit;

namespace GestionActivosTI.API.Tests.Services;

/// <summary>
/// Pruebas unitarias del módulo de Reportes. Verifican los cuatro informes
/// del sistema sobre una base de datos en memoria, sin depender del servidor
/// de base de datos ni de la interfaz de usuario.
/// </summary>
public class ReportesServiceTests
{
    // ── Utilidades de preparación ─────────────────────────────────────────

    private static Activo NuevoActivo(AppDbContext db, string nombre, string estado = "Activo",
                                      decimal? costo = null, DateOnly? vencimiento = null,
                                      int diasAviso = 30)
    {
        var activo = new Activo
        {
            Nombre               = nombre,
            Codigo               = $"COD-{nombre.GetHashCode() & 0xFFF:X3}",
            TipoActivoId         = 1,
            Estado               = estado,
            Costo                = costo,
            FechaVencimiento     = vencimiento,
            DiasAvisoVencimiento = diasAviso,
            UsuarioCreadorId     = 1
        };
        db.Activos.Add(activo);
        db.SaveChanges();
        return activo;
    }

    private static Responsable NuevoResponsable(AppDbContext db, string nombre, string area = "Infraestructura",
                                                bool activo = true)
    {
        var responsable = new Responsable
        {
            Nombre = nombre,
            Area   = area,
            Email  = $"{nombre.Replace(" ", "").ToLowerInvariant()}@test.gt",
            Activo = activo
        };
        db.Responsables.Add(responsable);
        db.SaveChanges();
        return responsable;
    }

    private static void Asignar(AppDbContext db, Activo activo, Responsable responsable, bool vigente = true)
    {
        db.ActivoResponsables.Add(new ActivoResponsable
        {
            ActivoId           = activo.Id,
            ResponsableId      = responsable.Id,
            FechaInicio        = DateOnly.FromDateTime(DateTime.Today),
            EsActual           = vigente,
            UsuarioAsignadorId = 1
        });
        db.SaveChanges();
    }

    private static void AgregarComponente(AppDbContext db, Activo activo, string nombre,
                                          bool vulnerable = false, DateOnly? finSoporte = null)
    {
        db.ComponentesTecnologicos.Add(new ComponenteTecnologico
        {
            ActivoId              = activo.Id,
            Nombre                = nombre,
            Version               = "1.0",
            TieneVulnerabilidad   = vulnerable,
            DetalleVulnerabilidad = vulnerable ? "CVE de prueba" : null,
            FechaFinSoporte       = finSoporte
        });
        db.SaveChanges();
    }

    // ── Informe: resumen general ──────────────────────────────────────────

    [Fact]
    public async Task GetResumenAsync_CuentaLosActivosPorEstado()
    {
        using var db = TestDbContextFactory.Create();
        NuevoActivo(db, "Servidor A");
        NuevoActivo(db, "Servidor B");
        NuevoActivo(db, "Servidor C", "Mantenimiento");
        NuevoActivo(db, "Servidor D", "Retirado");
        var service = new ReportesService(db);

        var resumen = await service.GetResumenAsync();

        Assert.Equal(4, resumen.TotalActivos);
        Assert.Equal(2, resumen.ActivosActivos);
        Assert.Equal(1, resumen.ActivosMantenimiento);
        Assert.Equal(1, resumen.ActivosRetirados);
        Assert.Equal(0, resumen.ActivosInactivos);
    }

    [Fact]
    public async Task GetResumenAsync_AgrupaLosActivosPorTipo()
    {
        using var db = TestDbContextFactory.Create();
        NuevoActivo(db, "Servidor A");
        NuevoActivo(db, "Servidor B");
        var service = new ReportesService(db);

        var resumen = await service.GetResumenAsync();

        var grupo = Assert.Single(resumen.PorTipo);
        Assert.Equal("Servidor", grupo.Tipo);
        Assert.Equal(2, grupo.Cantidad);
    }

    [Fact]
    public async Task GetResumenAsync_CuentaUnicamenteLosResponsablesActivos()
    {
        using var db = TestDbContextFactory.Create();
        NuevoResponsable(db, "Ana Vigente");
        NuevoResponsable(db, "Beto Baja", activo: false);
        var service = new ReportesService(db);

        var resumen = await service.GetResumenAsync();

        Assert.Equal(1, resumen.TotalResponsables);
    }

    [Fact]
    public async Task GetResumenAsync_LimitaLosUltimosMovimientosADiez()
    {
        using var db = TestDbContextFactory.Create();
        var activo = NuevoActivo(db, "Servidor A");
        for (var i = 0; i < 15; i++)
        {
            db.HistorialCambios.Add(new HistorialCambio
            {
                ActivoId    = activo.Id,
                TipoCambio  = "Modificacion",
                Descripcion = $"Cambio {i}",
                UsuarioId   = 1,
                FechaCambio = DateTime.UtcNow.AddMinutes(i)
            });
        }
        await db.SaveChangesAsync();
        var service = new ReportesService(db);

        var resumen = await service.GetResumenAsync();

        Assert.Equal(10, resumen.UltimosMovimientos.Count);
        Assert.Equal("Cambio 14", resumen.UltimosMovimientos[0].Descripcion);
    }

    // ── Informe: vencimientos próximos ────────────────────────────────────

    [Fact]
    public async Task GetPorVencerAsync_IncluyeElActivoDentroDeSuPeriodoDeAviso()
    {
        using var db = TestDbContextFactory.Create();
        NuevoActivo(db, "Licencia próxima", vencimiento: DateOnly.FromDateTime(DateTime.Today.AddDays(10)));
        var service = new ReportesService(db);

        var resultado = await service.GetPorVencerAsync();

        var fila = Assert.Single(resultado);
        Assert.Equal("Licencia próxima", fila.Nombre);
        Assert.Equal(10, fila.DiasRestantes);
    }

    [Fact]
    public async Task GetPorVencerAsync_ExcluyeElActivoFueraDeSuPeriodoDeAviso()
    {
        using var db = TestDbContextFactory.Create();
        NuevoActivo(db, "Licencia lejana", vencimiento: DateOnly.FromDateTime(DateTime.Today.AddDays(120)));
        var service = new ReportesService(db);

        var resultado = await service.GetPorVencerAsync();

        Assert.Empty(resultado);
    }

    [Fact]
    public async Task GetPorVencerAsync_RespetaElUmbralAmpliadoDelActivo()
    {
        using var db = TestDbContextFactory.Create();
        // El mismo vencimiento a 120 días entra en aviso cuando el activo
        // está configurado con un año de anticipación (soporte largo).
        NuevoActivo(db, "Soporte largo",
                    vencimiento: DateOnly.FromDateTime(DateTime.Today.AddDays(120)),
                    diasAviso: 365);
        var service = new ReportesService(db);

        var resultado = await service.GetPorVencerAsync();

        var fila = Assert.Single(resultado);
        Assert.Equal(365, fila.DiasAviso);
    }

    [Fact]
    public async Task GetPorVencerAsync_ExcluyeLosActivosRetirados()
    {
        using var db = TestDbContextFactory.Create();
        NuevoActivo(db, "Licencia de activo retirado", estado: "Retirado",
                    vencimiento: DateOnly.FromDateTime(DateTime.Today.AddDays(5)));
        var service = new ReportesService(db);

        var resultado = await service.GetPorVencerAsync();

        Assert.Empty(resultado);
    }

    [Fact]
    public async Task GetPorVencerAsync_ReportaDiasNegativosCuandoElActivoYaVencio()
    {
        using var db = TestDbContextFactory.Create();
        NuevoActivo(db, "Licencia vencida", vencimiento: DateOnly.FromDateTime(DateTime.Today.AddDays(-7)));
        var service = new ReportesService(db);

        var resultado = await service.GetPorVencerAsync();

        var fila = Assert.Single(resultado);
        Assert.Equal(-7, fila.DiasRestantes);
    }

    // ── Informe: gastos por responsable ───────────────────────────────────

    [Fact]
    public async Task GetGastosPorResponsableAsync_SumaElCostoYCuentaLosActivos()
    {
        using var db = TestDbContextFactory.Create();
        var ana = NuevoResponsable(db, "Ana Martinez");
        Asignar(db, NuevoActivo(db, "Servidor A", costo: 45000m), ana);
        Asignar(db, NuevoActivo(db, "Servidor B", costo: 15000m), ana);
        var service = new ReportesService(db);

        var resultado = await service.GetGastosPorResponsableAsync();

        var fila = Assert.Single(resultado);
        Assert.Equal(2, fila.CantidadActivos);
        Assert.Equal(60000m, fila.CostoTotal);
        Assert.Equal("GTQ", fila.Moneda);
    }

    [Fact]
    public async Task GetGastosPorResponsableAsync_OrdenaDeMayorAMenorCosto()
    {
        using var db = TestDbContextFactory.Create();
        var ana  = NuevoResponsable(db, "Ana Martinez");
        var beto = NuevoResponsable(db, "Beto Lopez");
        Asignar(db, NuevoActivo(db, "Servidor barato", costo: 5000m), ana);
        Asignar(db, NuevoActivo(db, "Servidor caro", costo: 90000m), beto);
        var service = new ReportesService(db);

        var resultado = await service.GetGastosPorResponsableAsync();

        Assert.Equal("Beto Lopez", resultado[0].Nombre);
        Assert.Equal("Ana Martinez", resultado[1].Nombre);
    }

    [Fact]
    public async Task GetGastosPorResponsableAsync_IgnoraLasAsignacionesNoVigentes()
    {
        using var db = TestDbContextFactory.Create();
        var ana = NuevoResponsable(db, "Ana Martinez");
        Asignar(db, NuevoActivo(db, "Servidor devuelto", costo: 30000m), ana, vigente: false);
        var service = new ReportesService(db);

        var resultado = await service.GetGastosPorResponsableAsync();

        Assert.Empty(resultado);
    }

    [Fact]
    public async Task GetGastosPorResponsableAsync_TrataElCostoNoRegistradoComoCero()
    {
        using var db = TestDbContextFactory.Create();
        var ana = NuevoResponsable(db, "Ana Martinez");
        Asignar(db, NuevoActivo(db, "Servidor sin costo"), ana);
        var service = new ReportesService(db);

        var resultado = await service.GetGastosPorResponsableAsync();

        var fila = Assert.Single(resultado);
        Assert.Equal(0m, fila.CostoTotal);
    }

    // ── Informe: vulnerabilidades ─────────────────────────────────────────

    [Fact]
    public async Task GetVulnerabilidadesAsync_IncluyeElComponenteConVulnerabilidadDeclarada()
    {
        using var db = TestDbContextFactory.Create();
        AgregarComponente(db, NuevoActivo(db, "Sistema Contabilidad"), "Node.js", vulnerable: true);
        var service = new ReportesService(db);

        var resultado = await service.GetVulnerabilidadesAsync();

        var fila = Assert.Single(resultado);
        Assert.Equal("Node.js", fila.Componente);
        Assert.Equal("Vulnerabilidad declarada", fila.Motivo);
    }

    [Fact]
    public async Task GetVulnerabilidadesAsync_IncluyeElComponenteConSoporteFinalizado()
    {
        using var db = TestDbContextFactory.Create();
        AgregarComponente(db, NuevoActivo(db, "Sistema Nómina"), "Angular",
                          finSoporte: DateOnly.FromDateTime(DateTime.Today.AddYears(-1)));
        var service = new ReportesService(db);

        var resultado = await service.GetVulnerabilidadesAsync();

        var fila = Assert.Single(resultado);
        Assert.Equal("Soporte finalizado", fila.Motivo);
    }

    [Fact]
    public async Task GetVulnerabilidadesAsync_ExcluyeElComponenteConSoporteVigente()
    {
        using var db = TestDbContextFactory.Create();
        AgregarComponente(db, NuevoActivo(db, "Sistema Vigente"), "SQL Server",
                          finSoporte: DateOnly.FromDateTime(DateTime.Today.AddYears(3)));
        var service = new ReportesService(db);

        var resultado = await service.GetVulnerabilidadesAsync();

        Assert.Empty(resultado);
    }

    [Fact]
    public async Task GetVulnerabilidadesAsync_PrioritizaLasVulnerabilidadesSobreLosFinesDeSoporte()
    {
        using var db = TestDbContextFactory.Create();
        var activo = NuevoActivo(db, "Sistema Mixto");
        AgregarComponente(db, activo, "Componente sin soporte",
                          finSoporte: DateOnly.FromDateTime(DateTime.Today.AddYears(-1)));
        AgregarComponente(db, activo, "Componente vulnerable", vulnerable: true);
        var service = new ReportesService(db);

        var resultado = await service.GetVulnerabilidadesAsync();

        Assert.Equal(2, resultado.Count);
        Assert.Equal("Componente vulnerable", resultado[0].Componente);
    }
}
