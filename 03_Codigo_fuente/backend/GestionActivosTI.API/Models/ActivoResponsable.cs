namespace GestionActivosTI.API.Models;

public class ActivoResponsable
{
    public int      Id                 { get; set; }
    public int      ActivoId           { get; set; }
    public int      ResponsableId      { get; set; }
    public DateOnly FechaInicio        { get; set; }
    public DateOnly? FechaFin          { get; set; }
    public bool     EsActual           { get; set; } = true;
    public string?  Notas              { get; set; }
    public int      UsuarioAsignadorId { get; set; }
    public DateTime FechaAsignacion    { get; set; } = DateTime.UtcNow;

    // Navigation
    public Activo      Activo           { get; set; } = null!;
    public Responsable Responsable      { get; set; } = null!;
    public Usuario     UsuarioAsignador { get; set; } = null!;
}
