-- ============================================================
-- ACTUALIZACIÓN 03: Objetos de programación de la base de datos
-- Vistas, procedimientos almacenados, funciones y disparadores
--
-- GESTIÓN DE ACTIVOS TECNOLÓGICOS
-- Universidad Mariano Gálvez de Guatemala
-- Autor: Kevin Humberto Del Cid Morales
--
-- Ejecutar sobre la base de datos EXISTENTE, después de
-- 01_database.sql y 02_componentes_costos.sql. No borra datos.
-- ============================================================

USE GestionActivosTI;
GO

-- ============================================================
-- 1. TABLA DE APOYO: AuditoriaActivos
-- Bitácora de campos modificados. Es independiente de
-- HistorialCambios (que registra hechos de negocio escritos por
-- la API) para no duplicar registros: aquí se guarda el rastro
-- técnico campo por campo, alimentado por un disparador.
-- ============================================================
IF OBJECT_ID('AuditoriaActivos') IS NULL
BEGIN
    CREATE TABLE AuditoriaActivos (
        Id             INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
        ActivoId       INT           NOT NULL,
        Campo          NVARCHAR(60)  NOT NULL,
        ValorAnterior  NVARCHAR(300) NULL,
        ValorNuevo     NVARCHAR(300) NULL,
        UsuarioSesion  NVARCHAR(128) NOT NULL DEFAULT SUSER_SNAME(),
        FechaAuditoria DATETIME2     NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_Aud_ActivoId ON AuditoriaActivos(ActivoId);
    CREATE INDEX IX_Aud_Fecha    ON AuditoriaActivos(FechaAuditoria DESC);
END
GO

-- ============================================================
-- 2. FUNCIONES
-- ============================================================

-- fn_DiasParaVencimiento: días que faltan para una fecha.
-- Devuelve negativo cuando la fecha ya pasó.
CREATE OR ALTER FUNCTION dbo.fn_DiasParaVencimiento (@Fecha DATE)
RETURNS INT
AS
BEGIN
    IF @Fecha IS NULL RETURN NULL;
    RETURN DATEDIFF(DAY, CAST(GETDATE() AS DATE), @Fecha);
END
GO

-- fn_ResponsableActual: nombre del responsable vigente de un activo.
CREATE OR ALTER FUNCTION dbo.fn_ResponsableActual (@ActivoId INT)
RETURNS NVARCHAR(150)
AS
BEGIN
    DECLARE @Nombre NVARCHAR(150);
    SELECT TOP 1 @Nombre = r.Nombre
    FROM ActivoResponsable ar
        INNER JOIN Responsables r ON r.Id = ar.ResponsableId
    WHERE ar.ActivoId = @ActivoId AND ar.EsActual = 1
    ORDER BY ar.FechaAsignacion DESC;
    RETURN @Nombre;
END
GO

-- ============================================================
-- 3. VISTAS
-- ============================================================

-- vw_ActivosPorVencer: activos cuyo vencimiento cae dentro del
-- período de aviso configurado en cada activo.
CREATE OR ALTER VIEW dbo.vw_ActivosPorVencer
AS
SELECT
    a.Id,
    a.Codigo,
    a.Nombre,
    t.Nombre                              AS TipoActivo,
    a.Estado,
    a.FechaVencimiento,
    a.DiasAvisoVencimiento,
    dbo.fn_DiasParaVencimiento(a.FechaVencimiento) AS DiasRestantes,
    dbo.fn_ResponsableActual(a.Id)        AS Responsable,
    a.Costo,
    a.Moneda
FROM Activos a
    INNER JOIN TiposActivo t ON t.Id = a.TipoActivoId
WHERE a.FechaVencimiento IS NOT NULL
  AND a.Estado <> 'Retirado'
  AND dbo.fn_DiasParaVencimiento(a.FechaVencimiento) <= a.DiasAvisoVencimiento;
GO

-- vw_ComponentesEnRiesgo: componentes con vulnerabilidad
-- declarada o cuyo soporte del fabricante ya terminó.
CREATE OR ALTER VIEW dbo.vw_ComponentesEnRiesgo
AS
SELECT
    c.Id,
    c.ActivoId,
    a.Codigo,
    a.Nombre                              AS NombreActivo,
    c.Nombre                              AS Componente,
    c.Version,
    CASE WHEN c.TieneVulnerabilidad = 1
         THEN 'Vulnerabilidad declarada'
         ELSE 'Soporte finalizado' END    AS Motivo,
    c.DetalleVulnerabilidad               AS Detalle,
    c.FechaFinSoporte,
    dbo.fn_ResponsableActual(c.ActivoId)  AS Responsable
FROM ComponentesTecnologicos c
    INNER JOIN Activos a ON a.Id = c.ActivoId
WHERE a.Estado <> 'Retirado'
  AND ( c.TieneVulnerabilidad = 1
        OR (c.FechaFinSoporte IS NOT NULL AND c.FechaFinSoporte <= CAST(GETDATE() AS DATE)) );
GO

-- vw_GastoPorResponsable: inversión acumulada por responsable.
CREATE OR ALTER VIEW dbo.vw_GastoPorResponsable
AS
SELECT
    r.Id                                  AS ResponsableId,
    r.Nombre,
    r.Area,
    COUNT(a.Id)                           AS CantidadActivos,
    ISNULL(SUM(a.Costo), 0)               AS CostoTotal
FROM Responsables r
    INNER JOIN ActivoResponsable ar ON ar.ResponsableId = r.Id AND ar.EsActual = 1
    INNER JOIN Activos a            ON a.Id = ar.ActivoId AND a.Estado <> 'Retirado'
GROUP BY r.Id, r.Nombre, r.Area;
GO

-- vw_ResumenInventario: conteos globales para el tablero.
CREATE OR ALTER VIEW dbo.vw_ResumenInventario
AS
SELECT
    COUNT(*)                                                          AS TotalActivos,
    SUM(CASE WHEN Estado = 'Activo'        THEN 1 ELSE 0 END)         AS ActivosActivos,
    SUM(CASE WHEN Estado = 'Inactivo'      THEN 1 ELSE 0 END)         AS ActivosInactivos,
    SUM(CASE WHEN Estado = 'Mantenimiento' THEN 1 ELSE 0 END)         AS ActivosMantenimiento,
    SUM(CASE WHEN Estado = 'Retirado'      THEN 1 ELSE 0 END)         AS ActivosRetirados,
    ISNULL(SUM(Costo), 0)                                             AS ValorTotalRegistrado
FROM Activos;
GO

-- vw_HistorialDetallado: historial con los nombres ya resueltos,
-- para consulta directa y para el informe de trazabilidad.
CREATE OR ALTER VIEW dbo.vw_HistorialDetallado
AS
SELECT
    h.Id,
    h.FechaCambio,
    h.TipoCambio,
    h.Descripcion,
    h.ValorAnterior,
    h.ValorNuevo,
    a.Codigo                              AS CodigoActivo,
    a.Nombre                              AS NombreActivo,
    r.Nombre                              AS Responsable,
    u.Nombre                              AS UsuarioRegistro
FROM HistorialCambios h
    LEFT  JOIN Activos      a ON a.Id = h.ActivoId
    LEFT  JOIN Responsables r ON r.Id = h.ResponsableId
    INNER JOIN Usuarios     u ON u.Id = h.UsuarioId;
GO

-- ============================================================
-- 4. PROCEDIMIENTOS ALMACENADOS
-- ============================================================

-- sp_RegistrarCambioHistorial: punto único de escritura de la
-- bitácora de negocio. Valida que exista el activo y el usuario.
CREATE OR ALTER PROCEDURE dbo.sp_RegistrarCambioHistorial
    @ActivoId      INT           = NULL,
    @ResponsableId INT           = NULL,
    @TipoCambio    NVARCHAR(80),
    @Descripcion   NVARCHAR(500),
    @ValorAnterior NVARCHAR(300) = NULL,
    @ValorNuevo    NVARCHAR(300) = NULL,
    @UsuarioId     INT
AS
BEGIN
    SET NOCOUNT ON;

    IF @ActivoId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Activos WHERE Id = @ActivoId)
    BEGIN
        RAISERROR('El activo indicado no existe.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Id = @UsuarioId)
    BEGIN
        RAISERROR('El usuario indicado no existe.', 16, 1);
        RETURN;
    END

    INSERT INTO HistorialCambios
        (ActivoId, ResponsableId, TipoCambio, Descripcion, ValorAnterior, ValorNuevo, UsuarioId)
    VALUES
        (@ActivoId, @ResponsableId, @TipoCambio, @Descripcion, @ValorAnterior, @ValorNuevo, @UsuarioId);

    SELECT SCOPE_IDENTITY() AS HistorialId;
END
GO

-- sp_AsignarResponsable: cierra la asignación vigente y abre la
-- nueva dentro de una transacción, dejando constancia en la
-- bitácora. Evita que un activo quede con dos responsables.
CREATE OR ALTER PROCEDURE dbo.sp_AsignarResponsable
    @ActivoId           INT,
    @ResponsableId      INT,
    @UsuarioAsignadorId INT,
    @Notas              NVARCHAR(300) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM Activos WHERE Id = @ActivoId)
    BEGIN
        RAISERROR('El activo indicado no existe.', 16, 1);
        RETURN;
    END

    IF NOT EXISTS (SELECT 1 FROM Responsables WHERE Id = @ResponsableId AND Activo = 1)
    BEGIN
        RAISERROR('El responsable no existe o está dado de baja.', 16, 1);
        RETURN;
    END

    DECLARE @Anterior NVARCHAR(150) = dbo.fn_ResponsableActual(@ActivoId);
    DECLARE @Nuevo    NVARCHAR(150) = (SELECT Nombre FROM Responsables WHERE Id = @ResponsableId);

    BEGIN TRANSACTION;

        UPDATE ActivoResponsable
        SET EsActual = 0,
            FechaFin = CAST(GETDATE() AS DATE)
        WHERE ActivoId = @ActivoId AND EsActual = 1;

        INSERT INTO ActivoResponsable
            (ActivoId, ResponsableId, FechaInicio, EsActual, Notas, UsuarioAsignadorId)
        VALUES
            (@ActivoId, @ResponsableId, CAST(GETDATE() AS DATE), 1, @Notas, @UsuarioAsignadorId);

        EXEC dbo.sp_RegistrarCambioHistorial
            @ActivoId      = @ActivoId,
            @ResponsableId = @ResponsableId,
            @TipoCambio    = 'AsignacionResponsable',
            @Descripcion   = 'Asignación de responsable actualizada',
            @ValorAnterior = @Anterior,
            @ValorNuevo    = @Nuevo,
            @UsuarioId     = @UsuarioAsignadorId;

    COMMIT TRANSACTION;
END
GO

-- sp_ObtenerHistorialActivo: trazabilidad completa de un activo,
-- de lo más reciente a lo más antiguo.
CREATE OR ALTER PROCEDURE dbo.sp_ObtenerHistorialActivo
    @ActivoId INT,
    @Top      INT = 100
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Top)
        FechaCambio, TipoCambio, Descripcion,
        ValorAnterior, ValorNuevo, Responsable, UsuarioRegistro
    FROM dbo.vw_HistorialDetallado
    WHERE CodigoActivo = (SELECT Codigo FROM Activos WHERE Id = @ActivoId)
    ORDER BY FechaCambio DESC;
END
GO

-- sp_ActivosPorVencer: consulta parametrizada del informe de
-- vencimientos. Permite forzar un horizonte distinto al umbral
-- configurado en cada activo.
CREATE OR ALTER PROCEDURE dbo.sp_ActivosPorVencer
    @DiasHorizonte INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM dbo.vw_ActivosPorVencer
    WHERE @DiasHorizonte IS NULL OR DiasRestantes <= @DiasHorizonte
    ORDER BY DiasRestantes ASC;
END
GO

-- ============================================================
-- 5. DISPARADORES (TRIGGERS)
-- ============================================================

-- tr_Activos_Auditoria: registra en AuditoriaActivos cada cambio
-- de los campos sensibles del activo y actualiza la fecha de
-- modificación. No escribe en HistorialCambios para no duplicar
-- lo que registra la capa de servicios de la API.
CREATE OR ALTER TRIGGER dbo.tr_Activos_Auditoria
ON Activos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO AuditoriaActivos (ActivoId, Campo, ValorAnterior, ValorNuevo)
    SELECT i.Id, 'Estado', d.Estado, i.Estado
    FROM inserted i INNER JOIN deleted d ON d.Id = i.Id
    WHERE ISNULL(d.Estado, '') <> ISNULL(i.Estado, '');

    INSERT INTO AuditoriaActivos (ActivoId, Campo, ValorAnterior, ValorNuevo)
    SELECT i.Id, 'Ubicacion', d.Ubicacion, i.Ubicacion
    FROM inserted i INNER JOIN deleted d ON d.Id = i.Id
    WHERE ISNULL(d.Ubicacion, '') <> ISNULL(i.Ubicacion, '');

    INSERT INTO AuditoriaActivos (ActivoId, Campo, ValorAnterior, ValorNuevo)
    SELECT i.Id, 'Costo', CONVERT(NVARCHAR(300), d.Costo), CONVERT(NVARCHAR(300), i.Costo)
    FROM inserted i INNER JOIN deleted d ON d.Id = i.Id
    WHERE ISNULL(d.Costo, -1) <> ISNULL(i.Costo, -1);

    INSERT INTO AuditoriaActivos (ActivoId, Campo, ValorAnterior, ValorNuevo)
    SELECT i.Id, 'FechaVencimiento',
           CONVERT(NVARCHAR(300), d.FechaVencimiento, 23),
           CONVERT(NVARCHAR(300), i.FechaVencimiento, 23)
    FROM inserted i INNER JOIN deleted d ON d.Id = i.Id
    WHERE ISNULL(d.FechaVencimiento, '1900-01-01') <> ISNULL(i.FechaVencimiento, '1900-01-01');

    -- Sella la fecha de modificación. Los disparadores recursivos
    -- están desactivados por omisión, de modo que esta actualización
    -- no vuelve a invocar el disparador.
    UPDATE a
    SET FechaModificacion = GETDATE()
    FROM Activos a INNER JOIN inserted i ON i.Id = a.Id
    WHERE ISNULL(a.FechaModificacion, '1900-01-01') < DATEADD(SECOND, -1, GETDATE());
END
GO

-- tr_Componentes_FechaModificacion: mantiene actualizada la fecha
-- de modificación de los componentes tecnológicos.
CREATE OR ALTER TRIGGER dbo.tr_Componentes_FechaModificacion
ON ComponentesTecnologicos
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE c
    SET FechaModificacion = GETDATE()
    FROM ComponentesTecnologicos c INNER JOIN inserted i ON i.Id = c.Id;
END
GO

-- tr_ActivoResponsable_UnicoActual: impide que un mismo activo
-- quede con más de una asignación marcada como vigente.
CREATE OR ALTER TRIGGER dbo.tr_ActivoResponsable_UnicoActual
ON ActivoResponsable
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (
        SELECT ar.ActivoId
        FROM ActivoResponsable ar
            INNER JOIN inserted i ON i.ActivoId = ar.ActivoId
        WHERE ar.EsActual = 1
        GROUP BY ar.ActivoId
        HAVING COUNT(*) > 1
    )
    BEGIN
        -- Cierra las asignaciones vigentes anteriores y deja
        -- únicamente la más reciente como actual.
        UPDATE ar
        SET EsActual = 0,
            FechaFin = CAST(GETDATE() AS DATE)
        FROM ActivoResponsable ar
            INNER JOIN inserted i ON i.ActivoId = ar.ActivoId
        WHERE ar.EsActual = 1
          AND ar.Id < (SELECT MAX(i2.Id) FROM inserted i2 WHERE i2.ActivoId = ar.ActivoId);
    END
END
GO

-- ============================================================
-- 6. VERIFICACIÓN
-- ============================================================
PRINT 'Actualización 03 aplicada. Objetos creados:';
GO

SELECT
    CASE type
        WHEN 'V'  THEN 'Vista'
        WHEN 'P'  THEN 'Procedimiento almacenado'
        WHEN 'TR' THEN 'Disparador'
        WHEN 'FN' THEN 'Función escalar'
        WHEN 'U'  THEN 'Tabla'
    END              AS Tipo,
    name             AS Objeto,
    create_date      AS FechaCreacion
FROM sys.objects
WHERE type IN ('V','P','TR','FN')
   OR (type = 'U' AND name = 'AuditoriaActivos')
ORDER BY Tipo, name;
GO
