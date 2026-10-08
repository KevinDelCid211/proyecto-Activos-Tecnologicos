namespace GestionActivosTI.API.DTOs;

public class HistorialDto
{
    public int      Id            { get; set; }
    public int?     ActivoId      { get; set; }
    public string?  NombreActivo  { get; set; }
    public int?     ResponsableId    { get; set; }
    public string?  NombreResponsable { get; set; }
    public string   TipoCambio    { get; set; } = string.Empty;
    public string   Descripcion   { get; set; } = string.Empty;
    public string?  ValorAnterior { get; set; }
    public string?  ValorNuevo    { get; set; }
    public string   Usuario       { get; set; } = string.Empty;
    public DateTime FechaCambio   { get; set; }
}

public class ReporteResumenDto
{
    public int TotalActivos         { get; set; }
    public int ActivosActivos       { get; set; }
    public int ActivosInactivos     { get; set; }
    public int ActivosMantenimiento { get; set; }
    public int ActivosRetirados     { get; set; }
    public int TotalResponsables    { get; set; }
    public int TotalDocumentos      { get; set; }
    public List<ResumenPorTipoDto> PorTipo  { get; set; } = [];
    public List<HistorialDto>      UltimosMovimientos { get; set; } = [];
    public List<ActivoPorVencerDto> ActivosPorVencer  { get; set; } = [];
}

public class ActivoPorVencerDto
{
    public int      Id               { get; set; }
    public string   Nombre           { get; set; } = string.Empty;
    public string?  Codigo           { get; set; }
    public string   TipoActivo       { get; set; } = string.Empty;
    public DateOnly FechaVencimiento { get; set; }
    public int      DiasRestantes    { get; set; }
    public int      DiasAviso        { get; set; }
    public decimal? Costo            { get; set; }
    public string   Moneda           { get; set; } = "GTQ";
    public string?  Responsable      { get; set; }
}

public class GastoResponsableDto
{
    public int     ResponsableId   { get; set; }
    public string  Nombre          { get; set; } = string.Empty;
    public string  Area            { get; set; } = string.Empty;
    public int     CantidadActivos { get; set; }
    public decimal CostoTotal      { get; set; }
    public string  Moneda          { get; set; } = "GTQ";
}

public class ReporteVulnerabilidadDto
{
    public int       ActivoId         { get; set; }
    public string    NombreActivo     { get; set; } = string.Empty;
    public string?   Codigo           { get; set; }
    public string    TipoActivo       { get; set; } = string.Empty;
    public string?   Responsable      { get; set; }
    public string    Componente       { get; set; } = string.Empty;
    public string?   Version          { get; set; }
    public string?   Detalle          { get; set; }
    public DateOnly? FechaFinSoporte  { get; set; }
    public string    Motivo           { get; set; } = string.Empty; // Vulnerabilidad declarada | Fin de soporte
}

public class ResumenPorTipoDto
{
    public string Tipo     { get; set; } = string.Empty;
    public string? Icono   { get; set; }
    public int    Cantidad { get; set; }
}
