import { Injectable }  from '@angular/core';
import { HttpClient }  from '@angular/common/http';
import { ReporteResumen, TipoActivo, Historial, PagedResult,
         ActivoPorVencer, GastoResponsable, ReporteVulnerabilidad } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportesService {
  constructor(private http: HttpClient) {}

  getResumen() {
    return this.http.get<ReporteResumen>(`${environment.apiUrl}/reportes/resumen`);
  }

  getPorVencer() {
    return this.http.get<ActivoPorVencer[]>(`${environment.apiUrl}/reportes/por-vencer`);
  }

  getGastosPorResponsable() {
    return this.http.get<GastoResponsable[]>(`${environment.apiUrl}/reportes/gastos-por-responsable`);
  }

  getVulnerabilidades() {
    return this.http.get<ReporteVulnerabilidad[]>(`${environment.apiUrl}/reportes/vulnerabilidades`);
  }

  getTiposActivo() {
    return this.http.get<TipoActivo[]>(`${environment.apiUrl}/reportes/tipos-activo`);
  }

  getHistorialActivo(activoId: number) {
    return this.http.get<Historial[]>(`${environment.apiUrl}/historial/activo/${activoId}`);
  }

  getHistorialReciente(page = 1, pageSize = 20, categoria?: 'activos' | 'responsables') {
    let url = `${environment.apiUrl}/historial/reciente?page=${page}&pageSize=${pageSize}`;
    if (categoria) url += `&categoria=${categoria}`;
    return this.http.get<PagedResult<Historial>>(url);
  }
}
