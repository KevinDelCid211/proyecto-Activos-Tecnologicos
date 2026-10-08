using GestionActivosTI.API.Models;
using Microsoft.EntityFrameworkCore;

namespace GestionActivosTI.API.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Rol>               Roles               => Set<Rol>();
    public DbSet<Usuario>           Usuarios            => Set<Usuario>();
    public DbSet<TipoActivo>        TiposActivo         => Set<TipoActivo>();
    public DbSet<Activo>            Activos             => Set<Activo>();
    public DbSet<Responsable>       Responsables        => Set<Responsable>();
    public DbSet<ActivoResponsable> ActivoResponsables  => Set<ActivoResponsable>();
    public DbSet<HistorialCambio>   HistorialCambios    => Set<HistorialCambio>();
    public DbSet<Documento>         Documentos          => Set<Documento>();
    public DbSet<ComponenteTecnologico> ComponentesTecnologicos => Set<ComponenteTecnologico>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ── Rol ────────────────────────────────────────────────────────────
        mb.Entity<Rol>(e =>
        {
            e.ToTable("Roles");
            e.HasKey(r => r.Id);
            e.Property(r => r.Nombre).HasMaxLength(50).IsRequired();
        });

        // ── Usuario ────────────────────────────────────────────────────────
        mb.Entity<Usuario>(e =>
        {
            e.ToTable("Usuarios");
            e.HasKey(u => u.Id);
            e.Property(u => u.Nombre).HasMaxLength(100).IsRequired();
            e.Property(u => u.Email).HasMaxLength(150).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(256).IsRequired();
            e.HasOne(u => u.Rol).WithMany(r => r.Usuarios).HasForeignKey(u => u.RolId);
        });

        // ── TipoActivo ─────────────────────────────────────────────────────
        mb.Entity<TipoActivo>(e =>
        {
            e.ToTable("TiposActivo");
            e.HasKey(t => t.Id);
            e.Property(t => t.Nombre).HasMaxLength(100).IsRequired();
        });

        // ── Activo ─────────────────────────────────────────────────────────
        mb.Entity<Activo>(e =>
        {
            e.ToTable("Activos");
            e.HasKey(a => a.Id);
            e.Property(a => a.Nombre).HasMaxLength(150).IsRequired();
            e.Property(a => a.Codigo).HasMaxLength(50);
            e.Property(a => a.Estado).HasMaxLength(30).HasDefaultValue("Activo");
            e.Property(a => a.Costo).HasColumnType("decimal(12,2)");
            e.Property(a => a.Moneda).HasMaxLength(10).HasDefaultValue("GTQ");
            e.Property(a => a.DiasAvisoVencimiento).HasDefaultValue(30);
            e.HasOne(a => a.TipoActivo).WithMany(t => t.Activos).HasForeignKey(a => a.TipoActivoId);
            e.HasOne(a => a.UsuarioCreador).WithMany(u => u.ActivosCreados).HasForeignKey(a => a.UsuarioCreadorId);
        });

        // ── Responsable ────────────────────────────────────────────────────
        mb.Entity<Responsable>(e =>
        {
            e.ToTable("Responsables");
            e.HasKey(r => r.Id);
            e.Property(r => r.Nombre).HasMaxLength(150).IsRequired();
            e.Property(r => r.Area).HasMaxLength(100).IsRequired();
            e.Property(r => r.Email).HasMaxLength(150).IsRequired();
            e.Property(r => r.Observaciones).HasMaxLength(300);
            e.Property(r => r.ContactoRespaldoNombre).HasMaxLength(150);
            e.Property(r => r.ContactoRespaldoEmail).HasMaxLength(150);
        });

        // ── ActivoResponsable ──────────────────────────────────────────────
        mb.Entity<ActivoResponsable>(e =>
        {
            e.ToTable("ActivoResponsable");
            e.HasKey(ar => ar.Id);
            e.HasOne(ar => ar.Activo).WithMany(a => a.Responsables).HasForeignKey(ar => ar.ActivoId);
            e.HasOne(ar => ar.Responsable).WithMany(r => r.Activos).HasForeignKey(ar => ar.ResponsableId);
            e.HasOne(ar => ar.UsuarioAsignador).WithMany(u => u.AsignacionesHechas).HasForeignKey(ar => ar.UsuarioAsignadorId);
        });

        // ── HistorialCambio ────────────────────────────────────────────────
        mb.Entity<HistorialCambio>(e =>
        {
            e.ToTable("HistorialCambios");
            e.HasKey(h => h.Id);
            e.Property(h => h.TipoCambio).HasMaxLength(80).IsRequired();
            e.Property(h => h.Descripcion).HasMaxLength(500).IsRequired();
            e.HasOne(h => h.Activo).WithMany(a => a.HistorialCambios).HasForeignKey(h => h.ActivoId).IsRequired(false);
            e.HasOne(h => h.Responsable).WithMany().HasForeignKey(h => h.ResponsableId).IsRequired(false);
            e.HasOne(h => h.Usuario).WithMany(u => u.HistorialCambios).HasForeignKey(h => h.UsuarioId);
        });

        // ── Documento ──────────────────────────────────────────────────────
        mb.Entity<Documento>(e =>
        {
            e.ToTable("Documentos");
            e.HasKey(d => d.Id);
            e.Property(d => d.Nombre).HasMaxLength(200).IsRequired();
            e.Property(d => d.TipoDocumento).HasMaxLength(80).IsRequired();
            e.Property(d => d.RutaArchivo).HasMaxLength(500).IsRequired();
            e.HasOne(d => d.Activo).WithMany(a => a.Documentos).HasForeignKey(d => d.ActivoId);
            e.HasOne(d => d.UsuarioSubida).WithMany(u => u.DocumentosSubidos).HasForeignKey(d => d.UsuarioSubidaId);
        });

        // ── ComponenteTecnologico ──────────────────────────────────────────
        mb.Entity<ComponenteTecnologico>(e =>
        {
            e.ToTable("ComponentesTecnologicos");
            e.HasKey(c => c.Id);
            e.Property(c => c.Nombre).HasMaxLength(100).IsRequired();
            e.Property(c => c.Version).HasMaxLength(50);
            e.Property(c => c.DetalleVulnerabilidad).HasMaxLength(500);
            e.HasOne(c => c.Activo).WithMany(a => a.Componentes).HasForeignKey(c => c.ActivoId);
        });
    }
}
