using GestionActivosTI.API.Data;
using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Services;

public interface IResponsablesService
{
    Task<List<ResponsableDto>> GetAllAsync(bool? activo);
    Task<ResponsableDto?>      GetByIdAsync(int id);
    Task<Responsable>          CreateAsync(ResponsableCreateDto dto);
    Task<bool>                 UpdateAsync(int id, ResponsableCreateDto dto);
    Task<List<ActivoListDto>>  GetActivosAsignadosAsync(int responsableId);
    Task<bool>                 DesactivarAsync(int id, DesactivarResponsableDto dto, int usuarioId);
    Task<bool>                 ReactivarAsync(int id, string comentario, int usuarioId);
}

public class ResponsablesService(AppDbContext db) : IResponsablesService
{
    public async Task<List<ResponsableDto>> GetAllAsync(bool? activo)
    {
        var query = db.Responsables
            .Include(r => r.Activos.Where(ar => ar.EsActual))
            .AsQueryable();

        if (activo.HasValue)
            query = query.Where(r => r.Activo == activo.Value);

        return await query.OrderBy(r => r.Nombre).Select(r => new ResponsableDto
        {
            Id           = r.Id,
            Nombre       = r.Nombre,
            Area         = r.Area,
            Cargo        = r.Cargo,
            Email        = r.Email,
            Telefono     = r.Telefono,
            Activo       = r.Activo,
            TotalActivos = r.Activos.Count(ar => ar.EsActual),
            Observaciones = r.Observaciones,
            ContactoRespaldoNombre = r.ContactoRespaldoNombre,
            ContactoRespaldoEmail  = r.ContactoRespaldoEmail
        }).ToListAsync();
    }

    public async Task<ResponsableDto?> GetByIdAsync(int id)
    {
        var r = await db.Responsables
            .Include(r => r.Activos.Where(ar => ar.EsActual))
            .FirstOrDefaultAsync(r => r.Id == id);

        if (r is null) return null;

        return new ResponsableDto
        {
            Id           = r.Id,
            Nombre       = r.Nombre,
            Area         = r.Area,
            Cargo        = r.Cargo,
            Email        = r.Email,
            Telefono     = r.Telefono,
            Activo       = r.Activo,
            TotalActivos = r.Activos.Count(ar => ar.EsActual),
            Observaciones = r.Observaciones,
            ContactoRespaldoNombre = r.ContactoRespaldoNombre,
            ContactoRespaldoEmail  = r.ContactoRespaldoEmail
        };
    }

    public async Task<Responsable> CreateAsync(ResponsableCreateDto dto)
    {
        var responsable = new Responsable
        {
            Nombre   = dto.Nombre,
            Area     = dto.Area,
            Cargo    = dto.Cargo,
            Email    = dto.Email,
            Telefono = dto.Telefono,
            ContactoRespaldoNombre = dto.ContactoRespaldoNombre,
            ContactoRespaldoEmail  = dto.ContactoRespaldoEmail
        };
        db.Responsables.Add(responsable);
        await db.SaveChangesAsync();
        return responsable;
    }

    public async Task<bool> UpdateAsync(int id, ResponsableCreateDto dto)
    {
        var r = await db.Responsables.FindAsync(id);
        if (r is null) return false;

        r.Nombre   = dto.Nombre;
        r.Area     = dto.Area;
        r.Cargo    = dto.Cargo;
        r.Email    = dto.Email;
        r.Telefono = dto.Telefono;
        r.ContactoRespaldoNombre = dto.ContactoRespaldoNombre;
        r.ContactoRespaldoEmail  = dto.ContactoRespaldoEmail;

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ReactivarAsync(int id, string comentario, int usuarioId)
    {
        var r = await db.Responsables.FindAsync(id);
        if (r is null) return false;

        r.Activo        = true;
        r.Observaciones = $"Reactivado: {comentario}";

        db.HistorialCambios.Add(new HistorialCambio
        {
            ResponsableId = id,
            TipoCambio    = "ReactivacionResponsable",
            Descripcion   = comentario,
            UsuarioId     = usuarioId
        });

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DesactivarAsync(int id, DesactivarResponsableDto dto, int usuarioId)
    {
        var r = await db.Responsables.FindAsync(id);
        if (r is null) return false;

        r.Activo        = false;
        r.Observaciones = dto.Observacion;

        db.HistorialCambios.Add(new HistorialCambio
        {
            ResponsableId = id,
            TipoCambio    = "BajaResponsable",
            Descripcion   = dto.Observacion,
            UsuarioId     = usuarioId
        });

        var asignacionesActuales = await db.ActivoResponsables
            .Where(ar => ar.ResponsableId == id && ar.EsActual)
            .ToListAsync();

        var hoy = DateOnly.FromDateTime(DateTime.UtcNow);

        foreach (var asignacion in asignacionesActuales)
        {
            asignacion.EsActual = false;
            asignacion.FechaFin = hoy;

            if (dto.NuevoResponsableId.HasValue)
            {
                db.ActivoResponsables.Add(new ActivoResponsable
                {
                    ActivoId           = asignacion.ActivoId,
                    ResponsableId      = dto.NuevoResponsableId.Value,
                    FechaInicio        = hoy,
                    EsActual           = true,
                    UsuarioAsignadorId = usuarioId
                });

                db.HistorialCambios.Add(new HistorialCambio
                {
                    ActivoId    = asignacion.ActivoId,
                    TipoCambio  = "AsignacionResponsable",
                    Descripcion = $"Responsable reasignado por baja de {r.Nombre}. Motivo: {dto.Observacion}",
                    UsuarioId   = usuarioId
                });
            }
            else
            {
                db.HistorialCambios.Add(new HistorialCambio
                {
                    ActivoId    = asignacion.ActivoId,
                    TipoCambio  = "AsignacionResponsable",
                    Descripcion = $"Responsable removido por baja de {r.Nombre}. Motivo: {dto.Observacion}. El activo queda sin responsable asignado.",
                    UsuarioId   = usuarioId
                });
            }
        }

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<List<ActivoListDto>> GetActivosAsignadosAsync(int responsableId)
    {
        return await db.Activos
            .Include(a => a.TipoActivo)
            .Where(a => a.Responsables.Any(ar => ar.ResponsableId == responsableId && ar.EsActual))
            .OrderBy(a => a.Nombre)
            .Select(a => new ActivoListDto
            {
                Id            = a.Id,
                Nombre        = a.Nombre,
                Codigo        = a.Codigo,
                TipoActivo    = a.TipoActivo.Nombre,
                TipoIcono     = a.TipoActivo.Icono,
                Estado        = a.Estado,
                Ubicacion     = a.Ubicacion,
                DireccionIP   = a.DireccionIP,
                FechaCreacion = a.FechaCreacion
            }).ToListAsync();
    }
}
