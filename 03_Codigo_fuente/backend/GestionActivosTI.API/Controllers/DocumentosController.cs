using System.Security.Claims;
using GestionActivosTI.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GestionActivosTI.API.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DocumentosController(IDocumentosService service, IHttpContextAccessor ctx) : ControllerBase
{
    private static readonly string[] ExtensionesPermitidas =
        [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg", ".txt"];

    private static readonly string[] TiposDocumentoValidos =
        ["Manual", "Licencia", "Configuracion", "Contrato", "Certificado", "SolicitudAdministrativa", "Otro"];

    private const long TamanoMaximoBytes = 10 * 1024 * 1024; // 10 MB

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier) ?? "0");

    private string BaseUrl =>
        $"{ctx.HttpContext!.Request.Scheme}://{ctx.HttpContext.Request.Host}";

    [HttpGet("activo/{activoId}")]
    public async Task<IActionResult> GetByActivo(int activoId)
    {
        var list = await service.GetByActivoAsync(activoId);
        return Ok(list);
    }

    [HttpPost("subir")]
    [RequestSizeLimit(TamanoMaximoBytes)]
    public async Task<IActionResult> Subir(
        [FromForm] int     activoId,
        [FromForm] IFormFile file,
        [FromForm] string  tipo,
        [FromForm] string? descripcion)
    {
        if (file.Length == 0) return BadRequest(new { message = "Archivo vacío" });

        if (file.Length > TamanoMaximoBytes)
            return BadRequest(new { message = "El archivo excede el tamaño máximo permitido (10 MB)" });

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !ExtensionesPermitidas.Contains(extension))
            return BadRequest(new { message = $"Tipo de archivo no permitido. Extensiones válidas: {string.Join(", ", ExtensionesPermitidas)}" });

        if (!TiposDocumentoValidos.Contains(tipo))
            return BadRequest(new { message = $"Tipo de documento inválido. Valores permitidos: {string.Join(", ", TiposDocumentoValidos)}" });

        var doc = await service.SubirDocumentoAsync(activoId, file, tipo, descripcion, UserId, BaseUrl);
        return Ok(doc);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Eliminar(int id)
    {
        var ok = await service.EliminarDocumentoAsync(id);
        return ok ? NoContent() : NotFound();
    }
}
