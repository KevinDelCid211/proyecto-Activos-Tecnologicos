using System.ComponentModel.DataAnnotations;

namespace GestionActivosTI.API.DTOs;

public class ResponsableDto
{
    public int     Id            { get; set; }
    public string  Nombre        { get; set; } = string.Empty;
    public string  Area          { get; set; } = string.Empty;
    public string? Cargo         { get; set; }
    public string  Email         { get; set; } = string.Empty;
    public string? Telefono      { get; set; }
    public bool    Activo        { get; set; }
    public int     TotalActivos  { get; set; }
    public string? Observaciones { get; set; }
    public string? ContactoRespaldoNombre { get; set; }
    public string? ContactoRespaldoEmail  { get; set; }
}

public class ResponsableCreateDto
{
    [Required(ErrorMessage = "El nombre es requerido"), MaxLength(150)]
    public string  Nombre   { get; set; } = string.Empty;

    [Required(ErrorMessage = "El área es requerida"), MaxLength(100)]
    public string  Area     { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Cargo    { get; set; }

    [Required, EmailAddress, MaxLength(150)]
    public string  Email    { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Telefono { get; set; }

    [MaxLength(150)]
    public string? ContactoRespaldoNombre { get; set; }

    [EmailAddress, MaxLength(150)]
    public string? ContactoRespaldoEmail  { get; set; }
}

public class DesactivarResponsableDto
{
    [Required(ErrorMessage = "La contraseña es requerida")]
    public string Password    { get; set; } = string.Empty;

    [Required(ErrorMessage = "La observación es requerida"), MaxLength(300)]
    public string Observacion { get; set; } = string.Empty;

    [Range(1, int.MaxValue, ErrorMessage = "Responsable de reemplazo inválido")]
    public int?   NuevoResponsableId { get; set; }
}

public class ReactivarResponsableDto
{
    [Required(ErrorMessage = "La contraseña es requerida")]
    public string Password   { get; set; } = string.Empty;

    [Required(ErrorMessage = "El comentario es requerido"), MaxLength(300)]
    public string Comentario { get; set; } = string.Empty;
}

public class AsignarResponsableDto
{
    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un activo")]
    public int      ActivoId      { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un responsable")]
    public int      ResponsableId { get; set; }

    public DateOnly FechaInicio   { get; set; }

    [MaxLength(300)]
    public string?  Notas         { get; set; }
}

public class DocumentoDto
{
    public int      Id            { get; set; }
    public string   Nombre        { get; set; } = string.Empty;
    public string   TipoDocumento { get; set; } = string.Empty;
    public string?  Extension     { get; set; }
    public long?    TamanoBytes   { get; set; }
    public string?  Descripcion   { get; set; }
    public string   UsuarioSubida { get; set; } = string.Empty;
    public DateTime FechaSubida   { get; set; }
    public string   UrlDescarga   { get; set; } = string.Empty;
}
