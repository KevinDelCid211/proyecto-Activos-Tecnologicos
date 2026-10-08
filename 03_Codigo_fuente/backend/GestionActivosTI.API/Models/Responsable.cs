namespace GestionActivosTI.API.Models;

public class Responsable
{
    public int      Id            { get; set; }
    public string   Nombre        { get; set; } = string.Empty;
    public string   Area          { get; set; } = string.Empty;
    public string?  Cargo         { get; set; }
    public string   Email         { get; set; } = string.Empty;
    public string?  Telefono      { get; set; }
    public bool     Activo        { get; set; } = true;
    public string?  Observaciones { get; set; }
    public string?  ContactoRespaldoNombre { get; set; }
    public string?  ContactoRespaldoEmail  { get; set; }
    public DateTime FechaCreacion { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<ActivoResponsable> Activos { get; set; } = [];
}
