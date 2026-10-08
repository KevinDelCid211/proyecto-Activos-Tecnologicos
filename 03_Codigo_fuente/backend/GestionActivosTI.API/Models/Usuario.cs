namespace GestionActivosTI.API.Models;

public class Usuario
{
    public int       Id             { get; set; }
    public string    Nombre         { get; set; } = string.Empty;
    public string    Email          { get; set; } = string.Empty;
    public string    PasswordHash   { get; set; } = string.Empty;
    public int       RolId          { get; set; }
    public bool      Activo         { get; set; } = true;
    public DateTime  FechaCreacion  { get; set; } = DateTime.UtcNow;
    public DateTime? UltimoAcceso   { get; set; }

    // Navigation
    public Rol       Rol            { get; set; } = null!;
    public ICollection<Activo>            ActivosCreados    { get; set; } = [];
    public ICollection<HistorialCambio>   HistorialCambios  { get; set; } = [];
    public ICollection<ActivoResponsable> AsignacionesHechas { get; set; } = [];
    public ICollection<Documento>         DocumentosSubidos  { get; set; } = [];
}
