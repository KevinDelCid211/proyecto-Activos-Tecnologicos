namespace GestionActivosTI.API.Models;

public class ComponenteTecnologico
{
    public int       Id                    { get; set; }
    public int       ActivoId              { get; set; }
    public string    Nombre                { get; set; } = string.Empty;
    public string?   Version               { get; set; }
    public bool      TieneVulnerabilidad   { get; set; }
    public string?   DetalleVulnerabilidad { get; set; }
    public DateOnly? FechaFinSoporte       { get; set; }
    public DateTime  FechaRegistro         { get; set; } = DateTime.UtcNow;
    public DateTime? FechaModificacion     { get; set; }

    // Navigation
    public Activo Activo { get; set; } = null!;
}
