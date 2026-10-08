using GestionActivosTI.API.Data;
using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Services;

public interface IDocumentosService
{
    Task<DocumentoDto>  SubirDocumentoAsync(int activoId, IFormFile file, string tipo, string? descripcion, int usuarioId, string baseUrl);
    Task<bool>          EliminarDocumentoAsync(int documentoId);
    Task<List<DocumentoDto>> GetByActivoAsync(int activoId);
}

public class DocumentosService(AppDbContext db, IConfiguration config) : IDocumentosService
{
    private readonly string _basePath = config["FileStorage:BasePath"] ?? "wwwroot/uploads";

    public async Task<DocumentoDto> SubirDocumentoAsync(int activoId, IFormFile file, string tipo, string? descripcion, int usuarioId, string baseUrl)
    {
        Directory.CreateDirectory(_basePath);

        var extension = Path.GetExtension(file.FileName);
        var fileName  = $"{Guid.NewGuid()}{extension}";
        var filePath  = Path.Combine(_basePath, fileName);

        await using var stream = File.Create(filePath);
        await file.CopyToAsync(stream);

        var documento = new Documento
        {
            ActivoId        = activoId,
            Nombre          = file.FileName,
            TipoDocumento   = tipo,
            RutaArchivo     = filePath,
            Extension       = extension,
            TamanoBytes     = file.Length,
            Descripcion     = descripcion,
            UsuarioSubidaId = usuarioId
        };

        db.Documentos.Add(documento);

        db.HistorialCambios.Add(new HistorialCambio
        {
            ActivoId    = activoId,
            TipoCambio  = "DocumentoAdjunto",
            Descripcion = $"Documento adjuntado: {file.FileName} ({tipo})",
            UsuarioId   = usuarioId
        });

        await db.SaveChangesAsync();

        var usuario = await db.Usuarios.FindAsync(usuarioId);

        return new DocumentoDto
        {
            Id            = documento.Id,
            Nombre        = documento.Nombre,
            TipoDocumento = documento.TipoDocumento,
            Extension     = documento.Extension,
            TamanoBytes   = documento.TamanoBytes,
            Descripcion   = documento.Descripcion,
            UsuarioSubida = usuario?.Nombre ?? "Desconocido",
            FechaSubida   = documento.FechaSubida,
            UrlDescarga   = $"{baseUrl}/uploads/{fileName}"
        };
    }

    public async Task<bool> EliminarDocumentoAsync(int documentoId)
    {
        var doc = await db.Documentos.FindAsync(documentoId);
        if (doc is null) return false;

        if (File.Exists(doc.RutaArchivo))
            File.Delete(doc.RutaArchivo);

        db.Documentos.Remove(doc);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task<List<DocumentoDto>> GetByActivoAsync(int activoId)
    {
        return await db.Documentos
            .Include(d => d.UsuarioSubida)
            .Where(d => d.ActivoId == activoId)
            .OrderByDescending(d => d.FechaSubida)
            .Select(d => new DocumentoDto
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
            }).ToListAsync();
    }
}
