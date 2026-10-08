using System.Security.Claims;
using GestionActivosTI.API.DTOs;
using GestionActivosTI.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionActivosTI.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class ResponsablesController(IResponsablesService service, IAuthService authService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] bool? activo)
    {
        var list = await service.GetAllAsync(activo);
        return Ok(list);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var item = await service.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{id}/activos")]
    public async Task<IActionResult> GetActivosAsignados(int id)
    {
        var list = await service.GetActivosAsignadosAsync(id);
        return Ok(list);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ResponsableCreateDto dto)
    {
        var resp = await service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = resp.Id }, resp);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] ResponsableCreateDto dto)
    {
        var ok = await service.UpdateAsync(id, dto);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id}/reactivar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Reactivar(int id, [FromBody] ReactivarResponsableDto dto)
    {
        var passwordValida = await authService.VerificarPasswordAsync(UserId, dto.Password);
        if (!passwordValida)
            return Unauthorized(new { message = "Contraseña incorrecta" });

        var ok = await service.ReactivarAsync(id, dto.Comentario, UserId);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id}/desactivar")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Desactivar(int id, [FromBody] DesactivarResponsableDto dto)
    {
        var passwordValida = await authService.VerificarPasswordAsync(UserId, dto.Password);
        if (!passwordValida)
            return Unauthorized(new { message = "Contraseña incorrecta" });

        var ok = await service.DesactivarAsync(id, dto, UserId);
        return ok ? NoContent() : NotFound();
    }
}
