namespace GestionActivosTI.API.Models;

public class HistorialCambio
{
    public int      Id             { get; set; }
    public int?     ActivoId       { get; set; }
    public int?     ResponsableId  { get; set; }
    public string   TipoCambio     { get; set; } = string.Empty;
    public string   Descripcion    { get; set; } = string.Empty;
    public string?  ValorAnterior  { get; set; }
    public string?  ValorNuevo     { get; set; }
    public int      UsuarioId      { get; set; }
    public DateTime FechaCambio    { get; set; } = DateTime.UtcNow;

    // Navigation
    public Activo?      Activo      { get; set; }
    public Responsable? Responsable { get; set; }
    public Usuario       Usuario    { get; set; } = null!;
}
