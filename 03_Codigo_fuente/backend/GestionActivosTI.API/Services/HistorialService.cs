using GestionActivosTI.API.Data;
using GestionActivosTI.API.DTOs;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Services;

public interface IHistorialService
{
    Task<List<HistorialDto>>       GetByActivoAsync(int activoId);
    Task<PagedResult<HistorialDto>> GetRecenteAsync(int page, int pageSize, string? categoria);
}

public class HistorialService(AppDbContext db) : IHistorialService
{
    // Tipos de cambio que documentan quién es responsable de qué (altas, bajas, reasignaciones).
    // El resto del ciclo de vida del activo (creación, edición, cambio de estado, documentos) cae en "activos".
    private static readonly string[] TiposDeResponsable =
        ["AsignacionResponsable", "BajaResponsable", "ReactivacionResponsable"];

    public async Task<List<HistorialDto>> GetByActivoAsync(int activoId)
    {
        return await db.HistorialCambios
            .Include(h => h.Activo)
            .Include(h => h.Usuario)
            .Where(h => h.ActivoId == activoId)
            .OrderByDescending(h => h.FechaCambio)
            .Select(h => new HistorialDto
            {
                Id            = h.Id,
                ActivoId      = h.ActivoId,
                NombreActivo  = h.Activo!.Nombre,
                TipoCambio    = h.TipoCambio,
                Descripcion   = h.Descripcion,
                ValorAnterior = h.ValorAnterior,
                ValorNuevo    = h.ValorNuevo,
                Usuario       = h.Usuario.Nombre,
                FechaCambio   = h.FechaCambio
            }).ToListAsync();
    }

    public async Task<PagedResult<HistorialDto>> GetRecenteAsync(int page, int pageSize, string? categoria)
    {
        page     = page     < 1 ? 1  : page;
        pageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var query = db.HistorialCambios
            .Include(h => h.Activo)
            .Include(h => h.Responsable)
            .Include(h => h.Usuario)
            .AsQueryable();

        if (categoria == "responsables")
            query = query.Where(h => TiposDeResponsable.Contains(h.TipoCambio));
        else if (categoria == "activos")
            query = query.Where(h => !TiposDeResponsable.Contains(h.TipoCambio));

        query = query.OrderByDescending(h => h.FechaCambio);

        var totalCount = await query.CountAsync();

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => new HistorialDto
            {
                Id                = h.Id,
                ActivoId          = h.ActivoId,
                NombreActivo      = h.Activo != null ? h.Activo.Nombre : null,
                ResponsableId     = h.ResponsableId,
                NombreResponsable = h.Responsable != null ? h.Responsable.Nombre : null,
                TipoCambio        = h.TipoCambio,
                Descripcion       = h.Descripcion,
                ValorAnterior     = h.ValorAnterior,
                ValorNuevo        = h.ValorNuevo,
                Usuario           = h.Usuario.Nombre,
                FechaCambio       = h.FechaCambio
            }).ToListAsync();

        return new PagedResult<HistorialDto>
        {
            Items      = items,
            Page       = page,
            PageSize   = pageSize,
            TotalCount = totalCount
        };
    }
}
