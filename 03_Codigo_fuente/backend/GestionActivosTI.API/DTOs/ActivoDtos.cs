using System.ComponentModel.DataAnnotations;

namespace GestionActivosTI.API.DTOs;

public class ActivoListDto
{
    public int      Id               { get; set; }
    public string   Nombre           { get; set; } = string.Empty;
    public string?  Codigo           { get; set; }
    public string   TipoActivo       { get; set; } = string.Empty;
    public string?  TipoIcono        { get; set; }
    public string   Estado           { get; set; } = string.Empty;
    public string?  Ubicacion        { get; set; }
    public string?  DireccionIP      { get; set; }
    public string?  ResponsableActual { get; set; }
    public DateTime FechaCreacion    { get; set; }
}

public class ActivoDetailDto : ActivoListDto
{
    public int      TipoActivoId      { get; set; }
    public string?  Descripcion       { get; set; }
    public string?  SistemaOperativo  { get; set; }
    public string?  Version           { get; set; }
    public DateOnly? FechaAdquisicion { get; set; }
    public DateOnly? FechaVencimiento { get; set; }
    public decimal? Costo             { get; set; }
    public string   Moneda            { get; set; } = "GTQ";
    public int      DiasAvisoVencimiento { get; set; } = 30;
    public string?  Observaciones     { get; set; }
    public string   UsuarioCreador    { get; set; } = string.Empty;
    public DateTime? FechaModificacion { get; set; }
    public List<ResponsableAsignadoDto> Responsables { get; set; } = [];
    public List<DocumentoDto>           Documentos   { get; set; } = [];
    public List<ComponenteDto>          Componentes  { get; set; } = [];
}

public class ActivoCreateDto
{
    [Required(ErrorMessage = "El nombre es requerido"), MaxLength(150)]
    public string   Nombre           { get; set; } = string.Empty;

    [MaxLength(50)]
    public string?  Codigo           { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Debe seleccionar un tipo de activo")]
    public int      TipoActivoId     { get; set; }

    [MaxLength(500)]
    public string?  Descripcion      { get; set; }

    [Required, RegularExpression("^(Activo|Inactivo|Mantenimiento|Retirado)$",
        ErrorMessage = "Estado inválido. Valores permitidos: Activo, Inactivo, Mantenimiento, Retirado")]
    public string   Estado           { get; set; } = "Activo";

    [MaxLength(200)]
    public string?  Ubicacion        { get; set; }

    [MaxLength(45)]
    public string?  DireccionIP      { get; set; }

    [MaxLength(100)]
    public string?  SistemaOperativo { get; set; }

    [MaxLength(50)]
    public string?  Version          { get; set; }

    public DateOnly? FechaAdquisicion { get; set; }
    public DateOnly? FechaVencimiento { get; set; }

    [Range(0, 999999999, ErrorMessage = "El costo debe ser un valor positivo")]
    public decimal? Costo            { get; set; }

    [MaxLength(10)]
    public string   Moneda           { get; set; } = "GTQ";

    [Range(1, 3650, ErrorMessage = "Los días de aviso deben estar entre 1 y 3650")]
    public int      DiasAvisoVencimiento { get; set; } = 30;

    [MaxLength(500)]
    public string?  Observaciones    { get; set; }
}

public class ComponenteDto
{
    public int       Id                    { get; set; }
    public string    Nombre                { get; set; } = string.Empty;
    public string?   Version               { get; set; }
    public bool      TieneVulnerabilidad   { get; set; }
    public string?   DetalleVulnerabilidad { get; set; }
    public DateOnly? FechaFinSoporte       { get; set; }
}

public class ComponenteCreateDto
{
    [Required(ErrorMessage = "El nombre del componente es requerido"), MaxLength(100)]
    public string    Nombre                { get; set; } = string.Empty;

    [MaxLength(50)]
    public string?   Version               { get; set; }

    public bool      TieneVulnerabilidad   { get; set; }

    [MaxLength(500)]
    public string?   DetalleVulnerabilidad { get; set; }

    public DateOnly? FechaFinSoporte       { get; set; }
}

public class ActivoUpdateDto : ActivoCreateDto { }

public class ResponsableAsignadoDto
{
    public int      Id             { get; set; }
    public int      ResponsableId  { get; set; }
    public string   Nombre         { get; set; } = string.Empty;
    public string   Area           { get; set; } = string.Empty;
    public string?  Cargo          { get; set; }
    public DateOnly FechaInicio    { get; set; }
    public DateOnly? FechaFin      { get; set; }
    public bool     EsActual       { get; set; }
}
