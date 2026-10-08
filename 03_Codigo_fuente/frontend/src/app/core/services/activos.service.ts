import { Injectable }  from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { ActivoList, ActivoDetail, ActivoForm, AsignarResponsable, PagedResult,
         Componente, ComponenteForm } from '../models/models';
import { environment } from '../../../environments/environment';

const BASE = `${environment.apiUrl}/activos`;

@Injectable({ providedIn: 'root' })
export class ActivosService {
  constructor(private http: HttpClient) {}

  getAll(estado?: string, tipoId?: number, busqueda?: string, page = 1, pageSize = 20) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);
    if (estado)   params = params.set('estado',   estado);
    if (tipoId)   params = params.set('tipoId',   tipoId.toString());
    if (busqueda) params = params.set('busqueda', busqueda);
    return this.http.get<PagedResult<ActivoList>>(BASE, { params });
  }

  getById(id: number) {
    return this.http.get<ActivoDetail>(`${BASE}/${id}`);
  }

  create(dto: ActivoForm) {
    return this.http.post<{ id: number }>(BASE, dto);
  }

  update(id: number, dto: ActivoForm) {
    return this.http.put(`${BASE}/${id}`, dto);
  }

  delete(id: number) {
    return this.http.delete(`${BASE}/${id}`);
  }

  cambiarEstado(id: number, estado: string) {
    return this.http.patch(`${BASE}/${id}/estado`, JSON.stringify(estado),
      { headers: { 'Content-Type': 'application/json' } });
  }

  asignarResponsable(dto: AsignarResponsable) {
    return this.http.post(`${BASE}/asignar-responsable`, dto);
  }

  subirDocumento(activoId: number, file: File, tipo: string, descripcion?: string) {
    const form = new FormData();
    form.append('activoId', activoId.toString());
    form.append('file', file);
    form.append('tipo', tipo);
    if (descripcion) form.append('descripcion', descripcion);
    return this.http.post(`${environment.apiUrl}/documentos/subir`, form);
  }

  eliminarDocumento(documentoId: number) {
    return this.http.delete(`${environment.apiUrl}/documentos/${documentoId}`);
  }

  // ── Componentes tecnológicos ────────────────────────────
  agregarComponente(activoId: number, dto: ComponenteForm) {
    return this.http.post<Componente>(`${BASE}/${activoId}/componentes`, dto);
  }

  actualizarComponente(activoId: number, componenteId: number, dto: ComponenteForm) {
    return this.http.put(`${BASE}/${activoId}/componentes/${componenteId}`, dto);
  }

  eliminarComponente(activoId: number, componenteId: number) {
    return this.http.delete(`${BASE}/${activoId}/componentes/${componenteId}`);
  }
}
