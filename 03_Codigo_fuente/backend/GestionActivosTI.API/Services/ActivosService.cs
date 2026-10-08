using GestionActivosTI.API.Data;
using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Services;

public interface IActivosService
{
    Task<PagedResult<ActivoListDto>> GetAllAsync(string? estado, int? tipoId, string? busqueda, int page, int pageSize);
    Task<ActivoDetailDto?>     GetByIdAsync(int id);
    Task<Activo>               CreateAsync(ActivoCreateDto dto, int usuarioId);
    Task<bool>                 UpdateAsync(int id, ActivoUpdateDto dto, int usuarioId);
    Task<bool>                 DeleteAsync(int id);
    Task<bool>                 CambiarEstadoAsync(int id, string nuevoEstado, int usuarioId);
    Task<bool>                 AsignarResponsableAsync(AsignarResponsableDto dto, int usuarioId);
    Task<ComponenteDto?>       AgregarComponenteAsync(int activoId, ComponenteCreateDto dto, int usuarioId);
    Task<bool>                 ActualizarComponenteAsync(int activoId, int componenteId, ComponenteCreateDto dto, int usuarioId);
    Task<bool>                 EliminarComponenteAsync(int activoId, int componenteId, int usuarioId);
}

public class ActivosService(AppDbContext db) : IActivosService
{
    public async Task<PagedResult<ActivoListDto>> GetAllAsync(string? estado, int? tipoId, string? busqueda, int page, int pageSize)
    {
        page     = page     < 1 ? 1  : page;
        pageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var query = db.Activos
            .Include(a => a.TipoActivo)
            .Include(a => a.Responsables.Where(r => r.EsActual)).ThenInclude(r => r.Responsable)
            .AsQueryable();

        if (!string.IsNullOrEmpty(estado))
            query = query.Where(a => a.Estado == estado);

        if (tipoId.HasValue)
            query = query.Where(a => a.TipoActivoId == tipoId);

        if (!string.IsNullOrEmpty(busqueda))
            query = query.Where(a =>
                a.Nombre.Contains(busqueda) ||
                (a.Codigo != null && a.Codigo.Contains(busqueda)) ||
                (a.DireccionIP != null && a.DireccionIP.Contains(busqueda)));

        var totalCount = await query.CountAsync();

        var items = await query.OrderBy(a => a.Nombre)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(a => new ActivoListDto
            {
                Id               = a.Id,
                Nombre           = a.Nombre,
                Codigo           = a.Codigo,
                TipoActivo       = a.TipoActivo.Nombre,
                TipoIcono        = a.TipoActivo.Icono,
                Estado           = a.Estado,
                Ubicacion        = a.Ubicacion,
                DireccionIP      = a.DireccionIP,
                ResponsableActual = a.Responsables.Where(r => r.EsActual)
                                                   .Select(r => r.Responsable.Nombre)
                                                   .FirstOrDefault(),
                FechaCreacion    = a.FechaCreacion
            }).ToListAsync();

        return new PagedResult<ActivoListDto>
        {
            Items      = items,
            Page       = page,
            PageSize   = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<ActivoDetailDto?> GetByIdAsync(int id)
    {
        var a = await db.Activos
            .Include(a => a.TipoActivo)
            .Include(a => a.UsuarioCreador)
            .Include(a => a.Responsables).ThenInclude(r => r.Responsable)
            .Include(a => a.Documentos).ThenInclude(d => d.UsuarioSubida)
            .Include(a => a.Componentes)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (a is null) return null;

        return new ActivoDetailDto
        {
            Id               = a.Id,
            Nombre           = a.Nombre,
            Codigo           = a.Codigo,
            TipoActivoId     = a.TipoActivoId,
            TipoActivo       = a.TipoActivo.Nombre,
            TipoIcono        = a.TipoActivo.Icono,
            Descripcion      = a.Descripcion,
            Estado           = a.Estado,
            Ubicacion        = a.Ubicacion,
            DireccionIP      = a.DireccionIP,
            SistemaOperativo = a.SistemaOperativo,
            Version          = a.Version,
            FechaAdquisicion = a.FechaAdquisicion,
            FechaVencimiento = a.FechaVencimiento,
            Costo            = a.Costo,
            Moneda           = a.Moneda,
            DiasAvisoVencimiento = a.DiasAvisoVencimiento,
            Observaciones    = a.Observaciones,
            UsuarioCreador   = a.UsuarioCreador.Nombre,
            FechaCreacion    = a.FechaCreacion,
            FechaModificacion= a.FechaModificacion,
            ResponsableActual= a.Responsables.Where(r => r.EsActual)
                                              .Select(r => r.Responsable.Nombre)
                                              .FirstOrDefault(),
            Responsables = a.Responsables.OrderByDescending(r => r.FechaInicio).Select(r => new ResponsableAsignadoDto
            {
                Id            = r.Id,
                ResponsableId = r.ResponsableId,
                Nombre        = r.Responsable.Nombre,
                Area          = r.Responsable.Area,
                Cargo         = r.Responsable.Cargo,
                FechaInicio   = r.FechaInicio,
                FechaFin      = r.FechaFin,
                EsActual      = r.EsActual
            }).ToList(),
            Documentos = a.Documentos.OrderByDescending(d => d.FechaSubida).Select(d => new DocumentoDto
            {
                Id            = d.Id,
                Nombre        = d.Nombre,
                TipoDocumento = d.TipoDocumento,
                Extension     = d.Extension,
                TamanoBytes   = d.TamanoBytes,
                Descripcion   = d.Descripcion,
                UsuarioSubida = d.UsuarioSubida.Nombre,
                FechaSubida   = d.FechaSubida,
                UrlDescarga   = $"/uploads/{Path.GetFileName(d.RutaArchivo)}"
            }).ToList(),
            Componentes = a.Componentes.OrderBy(c => c.Nombre).Select(c => new ComponenteDto
            {
                Id                    = c.Id,
                Nombre                = c.Nombre,
                Version               = c.Version,
                TieneVulnerabilidad   = c.TieneVulnerabilidad,
                DetalleVulnerabilidad = c.DetalleVulnerabilidad,
                FechaFinSoporte       = c.FechaFinSoporte
            }).ToList()
        };
    }

    public async Task<Activo> CreateAsync(ActivoCreateDto dto, int usuarioId)
    {
        var activo = new Activo
        {
            Nombre           = dto.Nombre,
            Codigo           = dto.Codigo,
            TipoActivoId     = dto.TipoActivoId,
            Descripcion      = dto.Descripcion,
            Estado           = dto.Estado,
            Ubicacion        = dto.Ubicacion,
            DireccionIP      = dto.DireccionIP,
            SistemaOperativo = dto.SistemaOperativo,
            Version          = dto.Version,
            FechaAdquisicion = dto.FechaAdquisicion,
            FechaVencimiento = dto.FechaVencimiento,
            Costo            = dto.Costo,
            Moneda           = dto.Moneda,
            DiasAvisoVencimiento = dto.DiasAvisoVencimiento,
            Observaciones    = dto.Observaciones,
            UsuarioCreadorId = usuarioId
        };

        db.Activos.Add(activo);
        await db.SaveChangesAsync();

        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId    = activo.Id,
            TipoCambio  = "Creacion",
            Descripcion = $"Activo '{activo.Nombre}' registrado en el sistema",
            UsuarioId   = usuarioId
        });
        await db.SaveChangesAsync();

        return activo;
    }

    public async Task<bool> UpdateAsync(int id, ActivoUpdateDto dto, int usuarioId)
    {
        var activo = await db.Activos.FindAsync(id);
        if (activo is null) return false;

        var cambios = new List<string>();
        if (activo.Nombre    != dto.Nombre)    cambios.Add($"Nombre: {activo.Nombre} → {dto.Nombre}");
        if (activo.Estado    != dto.Estado)    cambios.Add($"Estado: {activo.Estado} → {dto.Estado}");
        if (activo.Ubicacion != dto.Ubicacion) cambios.Add($"Ubicación: {activo.Ubicacion} → {dto.Ubicacion}");
        if (activo.Costo     != dto.Costo)     cambios.Add($"Costo: {activo.Costo?.ToString("N2") ?? "—"} → {dto.Costo?.ToString("N2") ?? "—"}");

        activo.Nombre           = dto.Nombre;
        activo.Codigo           = dto.Codigo;
        activo.TipoActivoId     = dto.TipoActivoId;
        activo.Descripcion      = dto.Descripcion;
        activo.Estado           = dto.Estado;
        activo.Ubicacion        = dto.Ubicacion;
        activo.DireccionIP      = dto.DireccionIP;
        activo.SistemaOperativo = dto.SistemaOperativo;
        activo.Version          = dto.Version;
        activo.FechaAdquisicion = dto.FechaAdquisicion;
        activo.FechaVencimiento = dto.FechaVencimiento;
        activo.Costo            = dto.Costo;
        activo.Moneda           = dto.Moneda;
        activo.DiasAvisoVencimiento = dto.DiasAvisoVencimiento;
        activo.Observaciones    = dto.Observaciones;
        activo.FechaModificacion = DateTime.UtcNow;

        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId    = activo.Id,
            TipoCambio  = "Modificacion",
            Descripcion = cambios.Count > 0 ? string.Join("; ", cambios) : "Activo actualizado",
            UsuarioId   = usuarioId
        });

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var activo = await db.Activos.FindAsync(id);
        if (activo is null) return false;
        activo.Estado = "Retirado";
        activo.FechaModificacion = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CambiarEstadoAsync(int id, string nuevoEstado, int usuarioId)
    {
        var activo = await db.Activos.FindAsync(id);
        if (activo is null) return false;

        var anterior = activo.Estado;
        activo.Estado            = nuevoEstado;
        activo.FechaModificacion = DateTime.UtcNow;

        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId      = activo.Id,
            TipoCambio    = "CambioEstado",
            Descripcion   = $"Estado cambiado de {anterior} a {nuevoEstado}",
            ValorAnterior = anterior,
            ValorNuevo    = nuevoEstado,
            UsuarioId     = usuarioId
        });

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> AsignarResponsableAsync(AsignarResponsableDto dto, int usuarioId)
    {
        // Marcar asignaciones anteriores como no actuales
        var anteriores = await db.ActivoResponsables
            .Where(ar => ar.ActivoId == dto.ActivoId && ar.EsActual)
            .ToListAsync();

        foreach (var ar in anteriores)
        {
            ar.EsActual  = false;
            ar.FechaFin  = dto.FechaInicio.AddDays(-1);
        }

        var nueva = new ActivoResponsable
        {
            ActivoId           = dto.ActivoId,
            ResponsableId      = dto.ResponsableId,
            FechaInicio        = dto.FechaInicio,
            EsActual           = true,
            Notas              = dto.Notas,
            UsuarioAsignadorId = usuarioId
        };

        db.ActivoResponsables.Add(nueva);

        var responsable = await db.Responsables.FindAsync(dto.ResponsableId);
        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId    = dto.ActivoId,
            TipoCambio  = "AsignacionResponsable",
            Descripcion = $"Responsable asignado: {responsable?.Nombre ?? dto.ResponsableId.ToString()}",
            UsuarioId   = usuarioId
        });

        await db.SaveChangesAsync();
        return true;
    }

    // ── Componentes tecnológicos ───────────────────────────────────────────
    public async Task<ComponenteDto?> AgregarComponenteAsync(int activoId, ComponenteCreateDto dto, int usuarioId)
    {
        var activo = await db.Activos.FindAsync(activoId);
        if (activo is null) return null;

        var comp = new ComponenteTecnologico
        {
            ActivoId              = activoId,
            Nombre                = dto.Nombre,
            Version               = dto.Version,
            TieneVulnerabilidad   = dto.TieneVulnerabilidad,
            DetalleVulnerabilidad = dto.DetalleVulnerabilidad,
            FechaFinSoporte       = dto.FechaFinSoporte
        };
        db.ComponentesTecnologicos.Add(comp);

        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId    = activoId,
            TipoCambio  = "Modificacion",
            Descripcion = $"Componente agregado: {dto.Nombre} {dto.Version}".Trim()
                        + (dto.TieneVulnerabilidad ? " (con vulnerabilidad declarada)" : ""),
            UsuarioId   = usuarioId
        });

        await db.SaveChangesAsync();

        return new ComponenteDto
        {
            Id                    = comp.Id,
            Nombre                = comp.Nombre,
            Version               = comp.Version,
            TieneVulnerabilidad   = comp.TieneVulnerabilidad,
            DetalleVulnerabilidad = comp.DetalleVulnerabilidad,
            FechaFinSoporte       = comp.FechaFinSoporte
        };
    }

    public async Task<bool> ActualizarComponenteAsync(int activoId, int componenteId, ComponenteCreateDto dto, int usuarioId)
    {
        var comp = await db.ComponentesTecnologicos
            .FirstOrDefaultAsync(c => c.Id == componenteId && c.ActivoId == activoId);
        if (comp is null) return false;

        var cambios = new List<string>();
        if (comp.Version != dto.Version)
            cambios.Add($"versión {comp.Version ?? "—"} → {dto.Version ?? "—"}");
        if (comp.TieneVulnerabilidad != dto.TieneVulnerabilidad)
            cambios.Add(dto.TieneVulnerabilidad ? "vulnerabilidad marcada" : "vulnerabilidad resuelta");

        comp.Nombre                = dto.Nombre;
        comp.Version               = dto.Version;
        comp.TieneVulnerabilidad   = dto.TieneVulnerabilidad;
        comp.DetalleVulnerabilidad = dto.DetalleVulnerabilidad;
        comp.FechaFinSoporte       = dto.FechaFinSoporte;
        comp.FechaModificacion     = DateTime.UtcNow;

        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId    = activoId,
            TipoCambio  = "Modificacion",
            Descripcion = $"Componente {comp.Nombre}: " + (cambios.Count > 0 ? string.Join(", ", cambios) : "actualizado"),
            UsuarioId   = usuarioId
        });

        await db.SaveChangesAsync();
        return true;
    }

    public async Task<bool> EliminarComponenteAsync(int activoId, int componenteId, int usuarioId)
    {
        var comp = await db.ComponentesTecnologicos
            .FirstOrDefaultAsync(c => c.Id == componenteId && c.ActivoId == activoId);
        if (comp is null) return false;

        db.ComponentesTecnologicos.Remove(comp);

        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId    = activoId,
            TipoCambio  = "Modificacion",
            Descripcion = $"Componente eliminado: {comp.Nombre} {comp.Version}".Trim(),
            UsuarioId   = usuarioId
        });

        await db.SaveChangesAsync();
        return true;
    }
}
