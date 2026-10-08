namespace GestionActivosTI.API.Models;

public class Rol
{
    public int    Id          { get; set; }
    public string Nombre      { get; set; } = string.Empty;
    public string? Descripcion { get; set; }

    // Navigation
    public ICollection<Usuario> Usuarios { get; set; } = [];
}
