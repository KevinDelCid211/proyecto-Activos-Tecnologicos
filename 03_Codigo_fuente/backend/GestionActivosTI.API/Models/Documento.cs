namespace GestionActivosTI.API.Models;

public class Documento
{
    public int      Id              { get; set; }
    public int      ActivoId        { get; set; }
    public string   Nombre          { get; set; } = string.Empty;
    public string   TipoDocumento   { get; set; } = string.Empty;
    public string   RutaArchivo     { get; set; } = string.Empty;
    public string?  Extension       { get; set; }
    public long?    TamanoBytes     { get; set; }
    public string?  Descripcion     { get; set; }
    public int      UsuarioSubidaId { get; set; }
    public DateTime FechaSubida     { get; set; } = DateTime.UtcNow;

    // Navigation
    public Activo  Activo        { get; set; } = null!;
    public Usuario UsuarioSubida { get; set; } = null!;
}
