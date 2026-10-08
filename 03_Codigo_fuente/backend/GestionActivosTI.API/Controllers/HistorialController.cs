using GestionActivosTI.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionActivosTI.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class HistorialController(IHistorialService service) : ControllerBase
{
    [HttpGet("activo/{activoId}")]
    public async Task<IActionResult> GetByActivo(int activoId)
    {
        var list = await service.GetByActivoAsync(activoId);
        return Ok(list);
    }

    [HttpGet("reciente")]
    public async Task<IActionResult> GetReciente(
        [FromQuery] int     page = 1,
        [FromQuery] int     pageSize = 20,
        [FromQuery] string? categoria = null)
    {
        var result = await service.GetRecenteAsync(page, pageSize, categoria);
        return Ok(result);
    }
}
