-- ============================================================
-- ACTUALIZACIÓN 02: Componentes tecnológicos, costos y
-- umbral de aviso de vencimiento configurable
-- Ejecutar sobre la base de datos EXISTENTE (no borra datos)
-- ============================================================

USE GestionActivosTI;
GO

-- ── 1. Nuevos campos en Activos ─────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Activos') AND name = 'Costo')
    ALTER TABLE Activos ADD Costo DECIMAL(12,2) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Activos') AND name = 'Moneda')
    ALTER TABLE Activos ADD Moneda NVARCHAR(10) NOT NULL DEFAULT 'GTQ';
GO

-- Días de anticipación con que se avisa del vencimiento.
-- 30 por defecto; para soportes largos (ej. 10 años) puede ponerse 365.
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('Activos') AND name = 'DiasAvisoVencimiento')
    ALTER TABLE Activos ADD DiasAvisoVencimiento INT NOT NULL DEFAULT 30;
GO

-- ── 2. Tabla de componentes tecnológicos ────────────────────
IF OBJECT_ID('ComponentesTecnologicos') IS NULL
BEGIN
    CREATE TABLE ComponentesTecnologicos (
        Id                    INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
        ActivoId              INT           NOT NULL,
        Nombre                NVARCHAR(100) NOT NULL,          -- Node.js, Angular, SQL Server...
        Version               NVARCHAR(50)  NULL,
        TieneVulnerabilidad   BIT           NOT NULL DEFAULT 0,
        DetalleVulnerabilidad NVARCHAR(500) NULL,              -- CVE, descripción del riesgo
        FechaFinSoporte       DATE          NULL,              -- EOL / fin de mantenimiento del componente
        FechaRegistro         DATETIME2     NOT NULL DEFAULT GETDATE(),
        FechaModificacion     DATETIME2     NULL,
        CONSTRAINT FK_Comp_Activo FOREIGN KEY (ActivoId) REFERENCES Activos(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_Comp_ActivoId ON ComponentesTecnologicos(ActivoId);
    CREATE INDEX IX_Comp_Vulnerabilidad ON ComponentesTecnologicos(TieneVulnerabilidad);
END
GO

-- ── 3. Datos de ejemplo ─────────────────────────────────────
-- Costos de ejemplo para los activos seed
UPDATE Activos SET Costo = 45000.00 WHERE Codigo = 'SRV-001' AND Costo IS NULL;
UPDATE Activos SET Costo = 52000.00 WHERE Codigo = 'SRV-002' AND Costo IS NULL;
UPDATE Activos SET Costo = 28000.00, DiasAvisoVencimiento = 365 WHERE Codigo = 'DB-001'  AND Costo IS NULL; -- soporte largo: avisar con 1 año
UPDATE Activos SET Costo = 85000.00 WHERE Codigo = 'APP-001' AND Costo IS NULL;
UPDATE Activos SET Costo = 62000.00 WHERE Codigo = 'APP-002' AND Costo IS NULL;
UPDATE Activos SET Costo = 38000.00 WHERE Codigo = 'RED-001' AND Costo IS NULL;
UPDATE Activos SET Costo = 24000.00, DiasAvisoVencimiento = 365 WHERE Codigo = 'RED-002' AND Costo IS NULL;
UPDATE Activos SET Costo = 31000.00 WHERE Codigo = 'SRV-003' AND Costo IS NULL;
GO

-- Componentes de ejemplo para las aplicaciones
IF NOT EXISTS (SELECT 1 FROM ComponentesTecnologicos)
BEGIN
    DECLARE @app1 INT = (SELECT Id FROM Activos WHERE Codigo = 'APP-001');
    DECLARE @app2 INT = (SELECT Id FROM Activos WHERE Codigo = 'APP-002');
    DECLARE @db1  INT = (SELECT Id FROM Activos WHERE Codigo = 'DB-001');

    IF @app1 IS NOT NULL
    INSERT INTO ComponentesTecnologicos (ActivoId, Nombre, Version, TieneVulnerabilidad, DetalleVulnerabilidad, FechaFinSoporte) VALUES
    (@app1, 'Angular',    '14.2',  1, 'Versión sin soporte desde nov-2023; migrar a Angular 17+', '2023-11-18'),
    (@app1, 'Node.js',    '16.20', 1, 'EOL septiembre 2023; CVEs abiertos sin parche',            '2023-09-11'),
    (@app1, 'SQL Server', '2019',  0, NULL,                                                        '2030-01-08');

    IF @app2 IS NOT NULL
    INSERT INTO ComponentesTecnologicos (ActivoId, Nombre, Version, TieneVulnerabilidad, DetalleVulnerabilidad, FechaFinSoporte) VALUES
    (@app2, 'Angular',    '17.3',  0, NULL, '2025-05-15'),
    (@app2, '.NET',       '8.0',   0, NULL, '2026-11-10'),
    (@app2, 'SQL Server', '2019',  0, NULL, '2030-01-08');

    IF @db1 IS NOT NULL
    INSERT INTO ComponentesTecnologicos (ActivoId, Nombre, Version, TieneVulnerabilidad, DetalleVulnerabilidad, FechaFinSoporte) VALUES
    (@db1, 'SQL Server', '2019 CU23', 0, NULL, '2030-01-08');
END
GO

PRINT 'Actualización 02 aplicada: componentes tecnológicos, costos y umbral de aviso.';
GO
