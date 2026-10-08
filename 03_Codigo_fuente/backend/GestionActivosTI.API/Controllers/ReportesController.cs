using GestionActivosTI.API.Data;
using GestionActivosTI.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ReportesController(IReportesService service, AppDbContext db) : ControllerBase
{
    [HttpGet("resumen")]
    public async Task<IActionResult> GetResumen()
    {
        var resumen = await service.GetResumenAsync();
        return Ok(resumen);
    }

    [HttpGet("por-vencer")]
    public async Task<IActionResult> GetPorVencer()
        => Ok(await service.GetPorVencerAsync());

    [HttpGet("gastos-por-responsable")]
    public async Task<IActionResult> GetGastosPorResponsable()
        => Ok(await service.GetGastosPorResponsableAsync());

    [HttpGet("vulnerabilidades")]
    public async Task<IActionResult> GetVulnerabilidades()
        => Ok(await service.GetVulnerabilidadesAsync());

    [HttpGet("tipos-activo")]
    public async Task<IActionResult> GetTiposActivo()
    {
        var tipos = await db.TiposActivo
            .Where(t => t.Activo)
            .OrderBy(t => t.Nombre)
            .Select(t => new { t.Id, t.Nombre, t.Icono, t.Descripcion })
            .ToListAsync();
        return Ok(tipos);
    }
}
