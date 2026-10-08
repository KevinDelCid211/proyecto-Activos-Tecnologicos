namespace GestionActivosTI.API.Models;

public class TipoActivo
{
    public int     Id          { get; set; }
    public string  Nombre      { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string? Icono       { get; set; }
    public bool    Activo      { get; set; } = true;

    // Navigation
    public ICollection<Activo> Activos { get; set; } = [];
}
