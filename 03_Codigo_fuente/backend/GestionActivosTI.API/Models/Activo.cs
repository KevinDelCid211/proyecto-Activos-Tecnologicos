namespace GestionActivosTI.API.Models;

public class Activo
{
    public int       Id                { get; set; }
    public string    Nombre            { get; set; } = string.Empty;
    public string?   Codigo            { get; set; }
    public int       TipoActivoId      { get; set; }
    public string?   Descripcion       { get; set; }
    public string    Estado            { get; set; } = "Activo";
    public string?   Ubicacion         { get; set; }
    public string?   DireccionIP       { get; set; }
    public string?   SistemaOperativo  { get; set; }
    public string?   Version           { get; set; }
    public DateOnly? FechaAdquisicion  { get; set; }
    public DateOnly? FechaVencimiento  { get; set; }
    public decimal?  Costo             { get; set; }
    public string    Moneda            { get; set; } = "GTQ";
    public int       DiasAvisoVencimiento { get; set; } = 30;
    public string?   Observaciones     { get; set; }
    public int       UsuarioCreadorId  { get; set; }
    public DateTime  FechaCreacion     { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacion { get; set; }

    // Navigation
    public TipoActivo                   TipoActivo          { get; set; } = null!;
    public Usuario                      UsuarioCreador      { get; set; } = null!;
    public ICollection<ActivoResponsable> Responsables      { get; set; } = [];
    public ICollection<HistorialCambio>   HistorialCambios  { get; set; } = [];
    public ICollection<Documento>         Documentos        { get; set; } = [];
    public ICollection<ComponenteTecnologico> Componentes   { get; set; } = [];
}
