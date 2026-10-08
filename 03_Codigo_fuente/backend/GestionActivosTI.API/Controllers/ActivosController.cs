using System.Security.Claims;
using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionActivosTI.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ActivosController(IActivosService service) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? estado,
        [FromQuery] int?    tipoId,
        [FromQuery] string? busqueda,
        [FromQuery] int     page = 1,
        [FromQuery] int     pageSize = 20)
    {
        var result = await service.GetAllAsync(estado, tipoId, busqueda, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ActivoCreateDto dto)
    {
        var activo = await service.CreateAsync(dto, UserId);
        return CreatedAtAction(nameof(GetById), new { id = activo.Id }, activo);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ActivoUpdateDto dto)
    {
        var ok = await service.UpdateAsync(id, dto, UserId);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await service.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }

    private static readonly string[] EstadosValidos = ["Activo", "Inactivo", "Mantenimiento", "Retirado"];

    [HttpPatch("{id}/estado")]
    public async Task<IActionResult> CambiarEstado(int id, [FromBody] string nuevoEstado)
    {
        if (!EstadosValidos.Contains(nuevoEstado))
            return BadRequest(new { message = $"Estado inválido. Valores permitidos: {string.Join(", ", EstadosValidos)}" });

        var ok = await service.CambiarEstadoAsync(id, nuevoEstado, UserId);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("asignar-responsable")]
    public async Task<IActionResult> AsignarResponsable([FromBody] AsignarResponsableDto dto)
    {
        var ok = await service.AsignarResponsableAsync(dto, UserId);
        return ok ? Ok(new { message = "Responsable asignado correctamente" }) : BadRequest();
    }

    // ── Componentes tecnológicos ───────────────────────────────────────────
    [HttpPost("{id}/componentes")]
    public async Task<IActionResult> AgregarComponente(int id, [FromBody] ComponenteCreateDto dto)
    {
        var comp = await service.AgregarComponenteAsync(id, dto, UserId);
        return comp is null ? NotFound() : Ok(comp);
    }

    [HttpPut("{id}/componentes/{componenteId}")]
    public async Task<IActionResult> ActualizarComponente(int id, int componenteId, [FromBody] ComponenteCreateDto dto)
    {
        var ok = await service.ActualizarComponenteAsync(id, componenteId, dto, UserId);
        return ok ? NoContent() : NotFound();
    }

    [HttpDelete("{id}/componentes/{componenteId}")]
    public async Task<IActionResult> EliminarComponente(int id, int componenteId)
    {
        var ok = await service.EliminarComponenteAsync(id, componenteId, UserId);
        return ok ? NoContent() : NotFound();
    }
}
