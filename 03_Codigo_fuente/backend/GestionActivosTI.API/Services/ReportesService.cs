using GestionActivosTI.API.Data;
using GestionActivosTI.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Services;

public interface IReportesService
{
    Task<ReporteResumenDto>             GetResumenAsync();
    Task<List<ActivoPorVencerDto>>      GetPorVencerAsync();
    Task<List<GastoResponsableDto>>     GetGastosPorResponsableAsync();
    Task<List<ReporteVulnerabilidadDto>> GetVulnerabilidadesAsync();
}

public class ReportesService(AppDbContext db) : IReportesService
{
    // Un activo entra en aviso cuando los días restantes hasta su vencimiento
    // son menores o iguales a su umbral configurable (DiasAvisoVencimiento):
    // 30 días por defecto; 365 para activos con soporte largo (ej. 10 años).
    private static bool EstaPorVencer(Models.Activo a, DateOnly hoy) =>
        a.FechaVencimiento.HasValue
        && a.Estado != "Retirado"
        && (a.FechaVencimiento.Value.DayNumber - hoy.DayNumber) <= a.DiasAvisoVencimiento;

    public async Task<ReporteResumenDto> GetResumenAsync()
    {
        var activos      = await db.Activos
            .Include(a => a.TipoActivo)
            .Include(a => a.Responsables.Where(r => r.EsActual)).ThenInclude(r => r.Responsable)
            .ToListAsync();
        var responsables = await db.Responsables.CountAsync(r => r.Activo);
        var documentos   = await db.Documentos.CountAsync();
        var ultimos      = await db.HistorialCambios
            .Include(h => h.Activo).Include(h => h.Responsable).Include(h => h.Usuario)
            .OrderByDescending(h => h.FechaCambio).Take(10)
            .Select(h => new HistorialDto
            {
                Id                = h.Id,
                ActivoId          = h.ActivoId,
                NombreActivo      = h.Activo != null ? h.Activo.Nombre : null,
                ResponsableId     = h.ResponsableId,
                NombreResponsable = h.Responsable != null ? h.Responsable.Nombre : null,
                TipoCambio        = h.TipoCambio,
                Descripcion       = h.Descripcion,
                Usuario           = h.Usuario.Nombre,
                FechaCambio       = h.FechaCambio
            }).ToListAsync();

        var hoy = DateOnly.FromDateTime(DateTime.Today);
        var porVencer = activos
            .Where(a => EstaPorVencer(a, hoy))
            .OrderBy(a => a.FechaVencimiento)
            .Select(a => MapPorVencer(a, hoy))
            .ToList();

        var porTipo = activos
            .GroupBy(a => new { a.TipoActivo.Nombre, a.TipoActivo.Icono })
            .Select(g => new ResumenPorTipoDto
            {
                Tipo     = g.Key.Nombre,
                Icono    = g.Key.Icono,
                Cantidad = g.Count()
            }).ToList();

        return new ReporteResumenDto
        {
            TotalActivos         = activos.Count,
            ActivosActivos       = activos.Count(a => a.Estado == "Activo"),
            ActivosInactivos     = activos.Count(a => a.Estado == "Inactivo"),
            ActivosMantenimiento = activos.Count(a => a.Estado == "Mantenimiento"),
            ActivosRetirados     = activos.Count(a => a.Estado == "Retirado"),
            TotalResponsables    = responsables,
            TotalDocumentos      = documentos,
            PorTipo              = porTipo,
            UltimosMovimientos   = ultimos,
            ActivosPorVencer     = porVencer
        };
    }

    // ── Informe 1: activos con vencimiento próximo ─────────────────────────
    public async Task<List<ActivoPorVencerDto>> GetPorVencerAsync()
    {
        var hoy = DateOnly.FromDateTime(DateTime.Today);
        var activos = await db.Activos
            .Include(a => a.TipoActivo)
            .Include(a => a.Responsables.Where(r => r.EsActual)).ThenInclude(r => r.Responsable)
            .Where(a => a.FechaVencimiento != null && a.Estado != "Retirado")
            .ToListAsync();

        return activos
            .Where(a => EstaPorVencer(a, hoy))
            .OrderBy(a => a.FechaVencimiento)
            .Select(a => MapPorVencer(a, hoy))
            .ToList();
    }

    // ── Informe 2: gastos por responsable ──────────────────────────────────
    public async Task<List<GastoResponsableDto>> GetGastosPorResponsableAsync()
    {
        var asignaciones = await db.ActivoResponsables
            .Include(ar => ar.Responsable)
            .Include(ar => ar.Activo)
            .Where(ar => ar.EsActual && ar.Activo.Estado != "Retirado")
            .ToListAsync();

        return asignaciones
            .GroupBy(ar => new { ar.ResponsableId, ar.Responsable.Nombre, ar.Responsable.Area })
            .Select(g => new GastoResponsableDto
            {
                ResponsableId   = g.Key.ResponsableId,
                Nombre          = g.Key.Nombre,
                Area            = g.Key.Area,
                CantidadActivos = g.Count(),
                CostoTotal      = g.Sum(ar => ar.Activo.Costo ?? 0),
                Moneda          = "GTQ"
            })
            .OrderByDescending(g => g.CostoTotal)
            .ToList();
    }

    // ── Informe 3: activos con posible vulnerabilidad ──────────────────────
    // Incluye componentes marcados con vulnerabilidad y componentes cuyo
    // soporte finaliza este mes o ya finalizó.
    public async Task<List<ReporteVulnerabilidadDto>> GetVulnerabilidadesAsync()
    {
        var hoy      = DateOnly.FromDateTime(DateTime.Today);
        var finDeMes = new DateOnly(hoy.Year, hoy.Month, DateTime.DaysInMonth(hoy.Year, hoy.Month));

        var componentes = await db.ComponentesTecnologicos
            .Include(c => c.Activo).ThenInclude(a => a.TipoActivo)
            .Include(c => c.Activo).ThenInclude(a => a.Responsables.Where(r => r.EsActual)).ThenInclude(r => r.Responsable)
            .Where(c => c.Activo.Estado != "Retirado"
                     && (c.TieneVulnerabilidad
                         || (c.FechaFinSoporte != null && c.FechaFinSoporte <= finDeMes)))
            .ToListAsync();

        return componentes
            .OrderByDescending(c => c.TieneVulnerabilidad)
            .ThenBy(c => c.FechaFinSoporte)
            .Select(c => new ReporteVulnerabilidadDto
            {
                ActivoId        = c.ActivoId,
                NombreActivo    = c.Activo.Nombre,
                Codigo          = c.Activo.Codigo,
                TipoActivo      = c.Activo.TipoActivo.Nombre,
                Responsable     = c.Activo.Responsables.FirstOrDefault(r => r.EsActual)?.Responsable.Nombre,
                Componente      = c.Nombre,
                Version         = c.Version,
                Detalle         = c.DetalleVulnerabilidad,
                FechaFinSoporte = c.FechaFinSoporte,
                Motivo          = c.TieneVulnerabilidad
                                    ? "Vulnerabilidad declarada"
                                    : (c.FechaFinSoporte < hoy ? "Soporte finalizado" : "Soporte finaliza este mes")
            }).ToList();
    }

    private static ActivoPorVencerDto MapPorVencer(Models.Activo a, DateOnly hoy) => new()
    {
        Id               = a.Id,
        Nombre           = a.Nombre,
        Codigo           = a.Codigo,
        TipoActivo       = a.TipoActivo.Nombre,
        FechaVencimiento = a.FechaVencimiento!.Value,
        DiasRestantes    = a.FechaVencimiento!.Value.DayNumber - hoy.DayNumber,
        DiasAviso        = a.DiasAvisoVencimiento,
        Costo            = a.Costo,
        Moneda           = a.Moneda,
        Responsable      = a.Responsables.FirstOrDefault(r => r.EsActual)?.Responsable.Nombre
    };
}
