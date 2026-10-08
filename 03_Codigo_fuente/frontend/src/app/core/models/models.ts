// ── Paginación ────────────────────────────────────────────
export interface PagedResult<T> {
  items: T[]; page: number; pageSize: number;
  totalCount: number; totalPages: number;
}

// ── Auth ──────────────────────────────────────────────────
export interface LoginRequest  { email: string; password: string; }
export interface LoginResponse {
  token: string; nombre: string; email: string;
  rol: string;   expiracion: string;
}

// ── Activos ───────────────────────────────────────────────
export interface ActivoList {
  id: number; nombre: string; codigo?: string;
  tipoActivo: string; tipoIcono?: string;
  estado: string; ubicacion?: string; direccionIP?: string;
  responsableActual?: string; fechaCreacion: string;
}

export interface ActivoDetail extends ActivoList {
  tipoActivoId: number; descripcion?: string;
  sistemaOperativo?: string; version?: string;
  fechaAdquisicion?: string; fechaVencimiento?: string;
  costo?: number; moneda: string; diasAvisoVencimiento: number;
  observaciones?: string; usuarioCreador: string;
  fechaModificacion?: string;
  responsables: ResponsableAsignado[];
  documentos: Documento[];
  componentes: Componente[];
}

export interface ActivoForm {
  nombre: string; codigo?: string; tipoActivoId: number;
  descripcion?: string; estado: string; ubicacion?: string;
  direccionIP?: string; sistemaOperativo?: string;
  version?: string; fechaAdquisicion?: string;
  fechaVencimiento?: string;
  costo?: number; moneda?: string; diasAvisoVencimiento?: number;
  observaciones?: string;
}

// ── Componentes tecnológicos ──────────────────────────────
export interface Componente {
  id: number; nombre: string; version?: string;
  tieneVulnerabilidad: boolean; detalleVulnerabilidad?: string;
  fechaFinSoporte?: string;
}

export interface ComponenteForm {
  nombre: string; version?: string;
  tieneVulnerabilidad: boolean; detalleVulnerabilidad?: string;
  fechaFinSoporte?: string;
}

export interface ResponsableAsignado {
  id: number; responsableId: number; nombre: string;
  area: string; cargo?: string;
  fechaInicio: string; fechaFin?: string; esActual: boolean;
}

// ── Responsables ──────────────────────────────────────────
export interface Responsable {
  id: number; nombre: string; area: string; cargo?: string;
  email: string; telefono?: string;
  activo: boolean; totalActivos: number;
  observaciones?: string;
  contactoRespaldoNombre?: string;
  contactoRespaldoEmail?: string;
}

export interface ResponsableForm {
  nombre: string; area: string; cargo?: string;
  email: string; telefono?: string;
  contactoRespaldoNombre?: string;
  contactoRespaldoEmail?: string;
}

export interface DesactivarResponsable {
  password: string;
  observacion: string;
  nuevoResponsableId?: number;
}

export interface ReactivarResponsable {
  password: string;
  comentario: string;
}

export interface AsignarResponsable {
  activoId: number; responsableId: number;
  fechaInicio: string; notas?: string;
}

// ── Historial ─────────────────────────────────────────────
export interface Historial {
  id: number; activoId?: number; nombreActivo?: string;
  responsableId?: number; nombreResponsable?: string;
  tipoCambio: string; descripcion: string;
  valorAnterior?: string; valorNuevo?: string;
  usuario: string; fechaCambio: string;
}

// ── Documentos ────────────────────────────────────────────
export interface Documento {
  id: number; nombre: string; tipoDocumento: string;
  extension?: string; tamanoBytes?: number;
  descripcion?: string; usuarioSubida: string;
  fechaSubida: string; urlDescarga: string;
}

// ── Reportes ──────────────────────────────────────────────
export interface ReporteResumen {
  totalActivos: number; activosActivos: number;
  activosInactivos: number; activosMantenimiento: number;
  activosRetirados: number; totalResponsables: number;
  totalDocumentos: number;
  porTipo: ResumenPorTipo[];
  ultimosMovimientos: Historial[];
  activosPorVencer: ActivoPorVencer[];
}

export interface ActivoPorVencer {
  id: number; nombre: string; codigo?: string;
  tipoActivo: string; fechaVencimiento: string;
  diasRestantes: number; diasAviso: number;
  costo?: number; moneda: string; responsable?: string;
}

export interface GastoResponsable {
  responsableId: number; nombre: string; area: string;
  cantidadActivos: number; costoTotal: number; moneda: string;
}

export interface ReporteVulnerabilidad {
  activoId: number; nombreActivo: string; codigo?: string;
  tipoActivo: string; responsable?: string;
  componente: string; version?: string; detalle?: string;
  fechaFinSoporte?: string; motivo: string;
}

export interface ResumenPorTipo { tipo: string; icono?: string; cantidad: number; }

export interface TipoActivo { id: number; nombre: string; icono?: string; descripcion?: string; }
