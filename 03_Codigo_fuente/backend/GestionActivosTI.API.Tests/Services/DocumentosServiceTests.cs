using GestionActivosTI.API.Data;
using GestionActivosTI.API.Models;
using GestionActivosTI.API.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace GestionActivosTI.API.Tests.Services;

/// <summary>
/// Pruebas unitarias del módulo de Documentos adjuntos. Cada prueba trabaja
/// sobre una carpeta temporal propia, de modo que el almacenamiento físico
/// se ejercita de verdad sin tocar la carpeta de la aplicación.
/// </summary>
public class DocumentosServiceTests : IDisposable
{
    private readonly string _carpeta;

    public DocumentosServiceTests()
    {
        _carpeta = Path.Combine(Path.GetTempPath(), "gati-pruebas-" + Guid.NewGuid());
    }

    public void Dispose()
    {
        if (Directory.Exists(_carpeta)) Directory.Delete(_carpeta, recursive: true);
        GC.SuppressFinalize(this);
    }

    // ── Utilidades de preparación ─────────────────────────────────────────

    private DocumentosService CrearServicio(AppDbContext db)
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["FileStorage:BasePath"] = _carpeta
            })
            .Build();
        return new DocumentosService(db, config);
    }

    private static Activo NuevoActivo(AppDbContext db, string nombre = "Servidor de Pruebas")
    {
        var activo = new Activo
        {
            Nombre = nombre, TipoActivoId = 1, Estado = "Activo", UsuarioCreadorId = 1
        };
        db.Activos.Add(activo);
        db.SaveChanges();
        return activo;
    }

    /// <summary>Doble de archivo cargado, con contenido en memoria.</summary>
    private static IFormFile ArchivoDePrueba(string nombre = "contrato.pdf", string contenido = "contenido de prueba")
    {
        var bytes  = System.Text.Encoding.UTF8.GetBytes(contenido);
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", nombre)
        {
            Headers     = new HeaderDictionary(),
            ContentType = "application/pdf"
        };
    }

    // ── Carga de documentos ───────────────────────────────────────────────

    [Fact]
    public async Task SubirDocumentoAsync_EscribeElArchivoEnElAlmacenamiento()
    {
        using var db = TestDbContextFactory.Create();
        var activo   = NuevoActivo(db);
        var service  = CrearServicio(db);

        await service.SubirDocumentoAsync(activo.Id, ArchivoDePrueba(), "Contrato", null, 1, "http://localhost:5000");

        var archivos = Directory.GetFiles(_carpeta);
        Assert.Single(archivos);
        Assert.Equal("contenido de prueba", await File.ReadAllTextAsync(archivos[0]));
    }

    [Fact]
    public async Task SubirDocumentoAsync_RenombraElArchivoYConservaLaExtension()
    {
        using var db = TestDbContextFactory.Create();
        var activo   = NuevoActivo(db);
        var service  = CrearServicio(db);

        await service.SubirDocumentoAsync(activo.Id, ArchivoDePrueba("licencia original.pdf"), "Licencia", null, 1, "http://localhost:5000");

        var archivo = Path.GetFileName(Directory.GetFiles(_carpeta)[0]);
        Assert.EndsWith(".pdf", archivo);
        Assert.DoesNotContain("licencia original", archivo);
        Assert.True(Guid.TryParse(Path.GetFileNameWithoutExtension(archivo), out _));
    }

    [Fact]
    public async Task SubirDocumentoAsync_ConservaElNombreOriginalComoMetadato()
    {
        using var db = TestDbContextFactory.Create();
        var activo   = NuevoActivo(db);
        var service  = CrearServicio(db);

        var dto = await service.SubirDocumentoAsync(activo.Id, ArchivoDePrueba("manual del equipo.pdf"), "Manual", "Manual del fabricante", 1, "http://localhost:5000");

        Assert.Equal("manual del equipo.pdf", dto.Nombre);
        Assert.Equal("Manual", dto.TipoDocumento);
        Assert.Equal("Manual del fabricante", dto.Descripcion);
        Assert.Equal("Admin Test", dto.UsuarioSubida);
    }

    [Fact]
    public async Task SubirDocumentoAsync_RegistraElAsientoEnLaBitacora()
    {
        using var db = TestDbContextFactory.Create();
        var activo   = NuevoActivo(db);
        var service  = CrearServicio(db);

        await service.SubirDocumentoAsync(activo.Id, ArchivoDePrueba(), "Certificado", null, 1, "http://localhost:5000");

        var cambio = Assert.Single(db.HistorialCambios.Where(h => h.ActivoId == activo.Id));
        Assert.Equal("DocumentoAdjunto", cambio.TipoCambio);
        Assert.Contains("contrato.pdf", cambio.Descripcion);
    }

    [Fact]
    public async Task SubirDocumentoAsync_DevuelveLaUrlDeDescargaYElTamano()
    {
        using var db = TestDbContextFactory.Create();
        var activo   = NuevoActivo(db);
        var service  = CrearServicio(db);

        var dto = await service.SubirDocumentoAsync(activo.Id, ArchivoDePrueba(), "Contrato", null, 1, "http://localhost:5000");

        Assert.StartsWith("http://localhost:5000/uploads/", dto.UrlDescarga);
        Assert.Equal(19L, dto.TamanoBytes!.Value);
    }

    // ── Consulta ──────────────────────────────────────────────────────────

    [Fact]
    public async Task GetByActivoAsync_DevuelveSoloLosDocumentosDelActivoSolicitado()
    {
        using var db = TestDbContextFactory.Create();
        var activoA  = NuevoActivo(db, "Servidor A");
        var activoB  = NuevoActivo(db, "Servidor B");
        var service  = CrearServicio(db);
        await service.SubirDocumentoAsync(activoA.Id, ArchivoDePrueba("a.pdf"), "Manual", null, 1, "http://localhost:5000");
        await service.SubirDocumentoAsync(activoB.Id, ArchivoDePrueba("b.pdf"), "Manual", null, 1, "http://localhost:5000");

        var resultado = await service.GetByActivoAsync(activoA.Id);

        var doc = Assert.Single(resultado);
        Assert.Equal("a.pdf", doc.Nombre);
    }

    [Fact]
    public async Task GetByActivoAsync_OrdenaDelMasRecienteAlMasAntiguo()
    {
        using var db = TestDbContextFactory.Create();
        var activo   = NuevoActivo(db);
        var service  = CrearServicio(db);
        await service.SubirDocumentoAsync(activo.Id, ArchivoDePrueba("antiguo.pdf"), "Manual", null, 1, "http://localhost:5000");
        await Task.Delay(15);
        await service.SubirDocumentoAsync(activo.Id, ArchivoDePrueba("reciente.pdf"), "Manual", null, 1, "http://localhost:5000");

        var resultado = await service.GetByActivoAsync(activo.Id);

        Assert.Equal("reciente.pdf", resultado[0].Nombre);
        Assert.Equal("antiguo.pdf", resultado[1].Nombre);
    }

    [Fact]
    public async Task GetByActivoAsync_SinDocumentos_DevuelveListaVacia()
    {
        using var db = TestDbContextFactory.Create();
        var activo   = NuevoActivo(db);
        var service  = CrearServicio(db);

        var resultado = await service.GetByActivoAsync(activo.Id);

        Assert.Empty(resultado);
    }

    // ── Eliminación ───────────────────────────────────────────────────────

    [Fact]
    public async Task EliminarDocumentoAsync_BorraElRegistroYElArchivoFisico()
    {
        using var db = TestDbContextFactory.Create();
        var activo   = NuevoActivo(db);
        var service  = CrearServicio(db);
        var dto      = await service.SubirDocumentoAsync(activo.Id, ArchivoDePrueba(), "Contrato", null, 1, "http://localhost:5000");

        var eliminado = await service.EliminarDocumentoAsync(dto.Id);

        Assert.True(eliminado);
        Assert.Empty(db.Documentos.Where(d => d.Id == dto.Id));
        Assert.Empty(Directory.GetFiles(_carpeta));
    }

    [Fact]
    public async Task EliminarDocumentoAsync_ConIdInexistente_DevuelveFalse()
    {
        using var db = TestDbContextFactory.Create();
        var service  = CrearServicio(db);

        var eliminado = await service.EliminarDocumentoAsync(9999);

        Assert.False(eliminado);
    }
}
