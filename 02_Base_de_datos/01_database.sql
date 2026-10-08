-- ============================================================
-- GESTIÓN DE ACTIVOS TECNOLÓGICOS
-- Universidad Mariano Gálvez de Guatemala
-- Autor: Kevin Humberto Del Cid Morales
-- Servidor: ajustar al servidor SQL de la organizacion
-- ============================================================

USE master;
GO

IF EXISTS (SELECT name FROM sys.databases WHERE name = 'GestionActivosTI')
BEGIN
    ALTER DATABASE GestionActivosTI SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE GestionActivosTI;
END
GO

CREATE DATABASE GestionActivosTI
    COLLATE SQL_Latin1_General_CP1_CI_AS;
GO

USE GestionActivosTI;
GO

-- ============================================================
-- TABLA: Roles
-- ============================================================
CREATE TABLE Roles (
    Id        INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Nombre    NVARCHAR(50)  NOT NULL UNIQUE,
    Descripcion NVARCHAR(200) NULL
);
GO

-- ============================================================
-- TABLA: Usuarios
-- ============================================================
CREATE TABLE Usuarios (
    Id              INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Nombre          NVARCHAR(100) NOT NULL,
    Email           NVARCHAR(150) NOT NULL UNIQUE,
    PasswordHash    NVARCHAR(256) NOT NULL,
    RolId           INT           NOT NULL,
    Activo          BIT           NOT NULL DEFAULT 1,
    FechaCreacion   DATETIME2     NOT NULL DEFAULT GETDATE(),
    UltimoAcceso    DATETIME2     NULL,
    CONSTRAINT FK_Usuarios_Roles FOREIGN KEY (RolId) REFERENCES Roles(Id)
);
GO

CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
GO

-- ============================================================
-- TABLA: TiposActivo
-- ============================================================
CREATE TABLE TiposActivo (
    Id          INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Nombre      NVARCHAR(100) NOT NULL UNIQUE,
    Descripcion NVARCHAR(300) NULL,
    Icono       NVARCHAR(50)  NULL,
    Activo      BIT           NOT NULL DEFAULT 1
);
GO

-- ============================================================
-- TABLA: Activos
-- ============================================================
CREATE TABLE Activos (
    Id                  INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Nombre              NVARCHAR(150) NOT NULL,
    Codigo              NVARCHAR(50)  NULL UNIQUE,
    TipoActivoId        INT           NOT NULL,
    Descripcion         NVARCHAR(500) NULL,
    Estado              NVARCHAR(30)  NOT NULL DEFAULT 'Activo'   -- Activo | Inactivo | Mantenimiento | Retirado
        CHECK (Estado IN ('Activo','Inactivo','Mantenimiento','Retirado')),
    Ubicacion           NVARCHAR(200) NULL,
    DireccionIP         NVARCHAR(45)  NULL,
    SistemaOperativo    NVARCHAR(100) NULL,
    Version             NVARCHAR(50)  NULL,
    FechaAdquisicion    DATE          NULL,
    FechaVencimiento    DATE          NULL,
    Observaciones       NVARCHAR(500) NULL,
    UsuarioCreadorId    INT           NOT NULL,
    FechaCreacion       DATETIME2     NOT NULL DEFAULT GETDATE(),
    FechaModificacion   DATETIME2     NULL,
    CONSTRAINT FK_Activos_TipoActivo FOREIGN KEY (TipoActivoId) REFERENCES TiposActivo(Id),
    CONSTRAINT FK_Activos_UsuarioCreador FOREIGN KEY (UsuarioCreadorId) REFERENCES Usuarios(Id)
);
GO

CREATE INDEX IX_Activos_Estado      ON Activos(Estado);
CREATE INDEX IX_Activos_TipoActivo  ON Activos(TipoActivoId);
CREATE INDEX IX_Activos_Codigo      ON Activos(Codigo);
GO

-- ============================================================
-- TABLA: Responsables
-- ============================================================
CREATE TABLE Responsables (
    Id                     INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    Nombre                 NVARCHAR(150) NOT NULL,
    Area                   NVARCHAR(100) NOT NULL,
    Cargo                  NVARCHAR(100) NULL,
    Email                  NVARCHAR(150) NOT NULL,
    Telefono               NVARCHAR(20)  NULL,
    Activo                 BIT           NOT NULL DEFAULT 1,
    Observaciones          NVARCHAR(300) NULL,    -- motivo registrado al dar de baja
    ContactoRespaldoNombre NVARCHAR(150) NULL,     -- encargado alterno (ej. vacaciones)
    ContactoRespaldoEmail  NVARCHAR(150) NULL,
    FechaCreacion          DATETIME2     NOT NULL DEFAULT GETDATE()
);
GO

CREATE INDEX IX_Responsables_Email ON Responsables(Email);
GO

-- ============================================================
-- TABLA: ActivoResponsable  (asignación activo ↔ responsable)
-- ============================================================
CREATE TABLE ActivoResponsable (
    Id              INT       NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ActivoId        INT       NOT NULL,
    ResponsableId   INT       NOT NULL,
    FechaInicio     DATE      NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    FechaFin        DATE      NULL,
    EsActual        BIT       NOT NULL DEFAULT 1,
    Notas           NVARCHAR(300) NULL,
    UsuarioAsignadorId INT    NOT NULL,
    FechaAsignacion DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_AR_Activo         FOREIGN KEY (ActivoId)           REFERENCES Activos(Id),
    CONSTRAINT FK_AR_Responsable    FOREIGN KEY (ResponsableId)       REFERENCES Responsables(Id),
    CONSTRAINT FK_AR_UsuarioAsig    FOREIGN KEY (UsuarioAsignadorId)  REFERENCES Usuarios(Id)
);
GO

CREATE INDEX IX_AR_ActivoId      ON ActivoResponsable(ActivoId);
CREATE INDEX IX_AR_ResponsableId ON ActivoResponsable(ResponsableId);
GO

-- ============================================================
-- TABLA: HistorialCambios
-- ============================================================
CREATE TABLE HistorialCambios (
    Id              INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ActivoId        INT           NULL,        -- NULL cuando el cambio es sobre el responsable, no un activo puntual
    ResponsableId   INT           NULL,
    TipoCambio      NVARCHAR(80)  NOT NULL
        CHECK (TipoCambio IN ('Creacion','Modificacion','CambioEstado','AsignacionResponsable','DocumentoAdjunto','BajaResponsable','ReactivacionResponsable','Otro')),
    Descripcion     NVARCHAR(500) NOT NULL,
    ValorAnterior   NVARCHAR(300) NULL,
    ValorNuevo      NVARCHAR(300) NULL,
    UsuarioId       INT           NOT NULL,
    FechaCambio     DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_HC_Activo       FOREIGN KEY (ActivoId)      REFERENCES Activos(Id),
    CONSTRAINT FK_HC_Responsable  FOREIGN KEY (ResponsableId) REFERENCES Responsables(Id),
    CONSTRAINT FK_HC_Usuario      FOREIGN KEY (UsuarioId)     REFERENCES Usuarios(Id)
);
GO

CREATE INDEX IX_HC_ResponsableId ON HistorialCambios(ResponsableId);
GO

CREATE INDEX IX_HC_ActivoId   ON HistorialCambios(ActivoId);
CREATE INDEX IX_HC_FechaCambio ON HistorialCambios(FechaCambio DESC);
GO

-- ============================================================
-- TABLA: Documentos
-- ============================================================
CREATE TABLE Documentos (
    Id              INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    ActivoId        INT           NOT NULL,
    Nombre          NVARCHAR(200) NOT NULL,
    TipoDocumento   NVARCHAR(80)  NOT NULL
        CHECK (TipoDocumento IN ('Manual','Licencia','Configuracion','Contrato','Certificado','SolicitudAdministrativa','Otro')),
    RutaArchivo     NVARCHAR(500) NOT NULL,
    Extension       NVARCHAR(10)  NULL,
    TamanoBytes     BIGINT        NULL,
    Descripcion     NVARCHAR(300) NULL,
    UsuarioSubidaId INT           NOT NULL,
    FechaSubida     DATETIME2     NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_Doc_Activo   FOREIGN KEY (ActivoId)        REFERENCES Activos(Id),
    CONSTRAINT FK_Doc_Usuario  FOREIGN KEY (UsuarioSubidaId) REFERENCES Usuarios(Id)
);
GO

CREATE INDEX IX_Doc_ActivoId ON Documentos(ActivoId);
GO

-- ============================================================
-- DATOS SEED
-- ============================================================

-- Roles
INSERT INTO Roles (Nombre, Descripcion) VALUES
('Admin',   'Administrador del sistema con acceso total'),
('Usuario', 'Usuario estándar con acceso de lectura y registro');
GO

-- Usuario Admin (password: Admin@2024)
-- Hash BCrypt generado y verificado con BCrypt.Net-Next (el mismo paquete que usa la API)
INSERT INTO Usuarios (Nombre, Email, PasswordHash, RolId) VALUES
('Administrador', 'admin@gestionati.gt',
 '$2a$11$RF/R5PnkW23K6jiGCyZL1OumHiF8a5Y809PGKuYYTDN7vA3h7zTJu', 1),
('Kevin Del Cid',  'kevin@gestionati.gt',
 '$2a$11$RF/R5PnkW23K6jiGCyZL1OumHiF8a5Y809PGKuYYTDN7vA3h7zTJu', 1);
GO

-- Tipos de Activo
INSERT INTO TiposActivo (Nombre, Descripcion, Icono) VALUES
('Servidor',       'Servidores físicos y virtuales de la organización',    'dns'),
('Base de Datos',  'Motores y repositorios de bases de datos',             'storage'),
('Aplicación',     'Sistemas y aplicaciones que soportan procesos internos','apps'),
('Red',            'Equipos de red: switches, routers, firewalls',         'router'),
('Dispositivo',    'Computadoras, laptops, impresoras y periféricos',      'computer');
GO

-- Responsables de ejemplo
INSERT INTO Responsables (Nombre, Area, Cargo, Email, Telefono) VALUES
('Juan García',    'Infraestructura',   'Administrador de Servidores', 'jgarcia@empresa.gt',  '55551001'),
('María López',    'Bases de Datos',    'DBA Senior',                  'mlopez@empresa.gt',   '55551002'),
('Carlos Pérez',   'Desarrollo',        'Líder Técnico',               'cperez@empresa.gt',   '55551003'),
('Ana Martínez',   'Seguridad TI',      'Especialista en Seguridad',   'amartinez@empresa.gt','55551004'),
('Luis Sánchez',   'Soporte TI',        'Técnico de Soporte',          'lsanchez@empresa.gt', '55551005');
GO

-- Activos de ejemplo
INSERT INTO Activos (Nombre, Codigo, TipoActivoId, Descripcion, Estado, Ubicacion, DireccionIP, SistemaOperativo, Version, FechaAdquisicion, UsuarioCreadorId)
VALUES
('Servidor Web Principal',    'SRV-001', 1, 'Servidor principal para aplicaciones web de producción', 'Activo', 'DataCenter Piso 2, Rack A1', '192.168.1.10', 'Windows Server 2022', '21H2', '2022-03-15', 1),
('Servidor Base de Datos',    'SRV-002', 1, 'Servidor dedicado para SQL Server', 'Activo', 'DataCenter Piso 2, Rack A2', '192.168.1.11', 'Windows Server 2022', '21H2', '2022-03-15', 1),
('SQL Server Producción',     'DB-001',  2, 'Instancia SQL Server 2019 para bases de datos de producción', 'Activo', 'Servidor SRV-002', '192.168.1.11', 'SQL Server 2019', '15.0', '2022-03-15', 1),
('Sistema Contabilidad',      'APP-001', 3, 'Aplicación de gestión contable y financiera', 'Activo', 'Servidor SRV-001', NULL, NULL, '3.2.1', '2021-06-01', 1),
('Sistema Nómina',            'APP-002', 3, 'Sistema de gestión de nómina y recursos humanos', 'Activo', 'Servidor SRV-001', NULL, NULL, '2.5.0', '2021-06-01', 1),
('Firewall Principal',        'RED-001', 4, 'Firewall perimetral FortiGate 100F', 'Activo', 'DataCenter Piso 2', '192.168.0.1', 'FortiOS', '7.2', '2023-01-10', 1),
('Switch Core',               'RED-002', 4, 'Switch Cisco Catalyst 3850 core de red', 'Activo', 'DataCenter Piso 2, Rack B1', '192.168.1.2', 'Cisco IOS', '16.12', '2020-08-20', 1),
('Servidor Backup',           'SRV-003', 1, 'Servidor dedicado para respaldos y recuperación', 'Mantenimiento', 'DataCenter Piso 2, Rack A3', '192.168.1.12', 'Windows Server 2019', '1809', '2020-05-10', 1);
GO

-- Asignación activo-responsable
INSERT INTO ActivoResponsable (ActivoId, ResponsableId, FechaInicio, EsActual, UsuarioAsignadorId) VALUES
(1, 1, '2022-03-15', 1, 1),
(2, 1, '2022-03-15', 1, 1),
(3, 2, '2022-03-15', 1, 1),
(4, 3, '2021-06-01', 1, 1),
(5, 3, '2021-06-01', 1, 1),
(6, 4, '2023-01-10', 1, 1),
(7, 1, '2020-08-20', 1, 1),
(8, 1, '2020-05-10', 1, 1);
GO

-- Historial inicial
INSERT INTO HistorialCambios (ActivoId, TipoCambio, Descripcion, UsuarioId) VALUES
(1, 'Creacion', 'Activo registrado en el sistema', 1),
(2, 'Creacion', 'Activo registrado en el sistema', 1),
(3, 'Creacion', 'Activo registrado en el sistema', 1),
(4, 'Creacion', 'Activo registrado en el sistema', 1),
(5, 'Creacion', 'Activo registrado en el sistema', 1),
(6, 'Creacion', 'Activo registrado en el sistema', 1),
(7, 'Creacion', 'Activo registrado en el sistema', 1),
(8, 'Creacion', 'Activo registrado en el sistema', 1),
(8, 'CambioEstado', 'Estado cambiado a Mantenimiento por actualización de firmware', 1);
GO

PRINT 'Base de datos GestionActivosTI creada correctamente.';
PRINT 'Credenciales de acceso:';
PRINT '  admin@gestionati.gt  / Admin@2024';
PRINT '  kevin@gestionati.gt  / Admin@2024';
GO
