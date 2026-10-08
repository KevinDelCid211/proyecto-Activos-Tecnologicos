import { Injectable }   from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Responsable, ResponsableForm, ActivoList, DesactivarResponsable, ReactivarResponsable } from '../models/models';
import { environment }  from '../../../environments/environment';

const BASE = `${environment.apiUrl}/responsables`;

@Injectable({ providedIn: 'root' })
export class ResponsablesService {
  constructor(private http: HttpClient) {}

  getAll(activo?: boolean) {
    const params: any = {};
    if (activo !== undefined) params['activo'] = activo.toString();
    return this.http.get<Responsable[]>(BASE, { params });
  }

  getActivosAsignados(id: number) {
    return this.http.get<ActivoList[]>(`${BASE}/${id}/activos`);
  }

  getById(id: number) {
    return this.http.get<Responsable>(`${BASE}/${id}`);
  }

  create(dto: ResponsableForm) {
    return this.http.post<{ id: number }>(BASE, dto);
  }

  update(id: number, dto: ResponsableForm) {
    return this.http.put(`${BASE}/${id}`, dto);
  }

  desactivar(id: number, dto: DesactivarResponsable) {
    return this.http.post(`${BASE}/${id}/desactivar`, dto);
  }

  reactivar(id: number, dto: ReactivarResponsable) {
    return this.http.post(`${BASE}/${id}/reactivar`, dto);
  }
}
