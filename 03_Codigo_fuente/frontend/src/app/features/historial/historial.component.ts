import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { MatCardModule }   from '@angular/material/card';
import { MatTableModule }  from '@angular/material/table';
import { MatIconModule }   from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule, MatTabChangeEvent } from '@angular/material/tabs';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { RouterLink }      from '@angular/router';
import { ReportesService } from '../../core/services/reportes.service';
import { Historial }       from '../../core/models/models';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatTableModule, MatIconModule,
    MatButtonModule, MatTabsModule, MatPaginatorModule, MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <h1>Historial de Cambios</h1>
    </div>

    <mat-tab-group (selectedTabChange)="onTabChange($event)">
      <mat-tab label="Historial de Activos"></mat-tab>
      <mat-tab label="Historial de Responsables"></mat-tab>
    </mat-tab-group>

    <mat-card>
      <mat-card-content class="table-container">
        <mat-table [dataSource]="historial">
          <ng-container matColumnDef="referencia">
            <mat-header-cell *matHeaderCellDef>{{ categoriaActual === 'responsables' ? 'Responsable' : 'Activo' }}</mat-header-cell>
            <mat-cell *matCellDef="let h">
              @if (h.activoId) {
                <a [routerLink]="['/activos', h.activoId]" class="link-cell">{{ h.nombreActivo }}</a>
              } @else if (h.nombreResponsable) {
                <span class="responsable-cell">{{ h.nombreResponsable }}</span>
              } @else {
                <span>—</span>
              }
            </mat-cell>
          </ng-container>
          <ng-container matColumnDef="tipo">
            <mat-header-cell *matHeaderCellDef>Tipo de Cambio</mat-header-cell>
            <mat-cell *matCellDef="let h">
              <span [class]="'chip-tipo chip-' + h.tipoCambio">{{ h.tipoCambio }}</span>
            </mat-cell>
          </ng-container>
          <ng-container matColumnDef="desc">
            <mat-header-cell *matHeaderCellDef>Descripción</mat-header-cell>
            <mat-cell *matCellDef="let h"><span class="desc-truncada">{{ h.descripcion }}</span></mat-cell>
          </ng-container>
          <ng-container matColumnDef="usuario">
            <mat-header-cell *matHeaderCellDef>Usuario</mat-header-cell>
            <mat-cell *matCellDef="let h">{{ h.usuario }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="fecha">
            <mat-header-cell *matHeaderCellDef>Fecha y Hora</mat-header-cell>
            <mat-cell *matCellDef="let h">{{ h.fechaCambio | date:'dd/MM/yyyy HH:mm:ss' }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <mat-header-cell *matHeaderCellDef></mat-header-cell>
            <mat-cell *matCellDef="let h">
              <button mat-icon-button (click)="verDetalle(h)" matTooltip="Ver comentario completo">
                <mat-icon>visibility</mat-icon>
              </button>
            </mat-cell>
          </ng-container>
          <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: columns"></mat-row>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="columns.length" style="text-align:center;padding:24px">
              No hay cambios registrados en esta categoría
            </td>
          </tr>
        </mat-table>
        <mat-paginator
          [length]="totalCount"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          [pageSizeOptions]="[20, 50, 100]"
          (page)="onPageChange($event)">
        </mat-paginator>
      </mat-card-content>
    </mat-card>

    <!-- Panel: detalle del comentario/cambio -->
    @if (detalleTarget) {
      <div class="form-overlay" (click)="detalleTarget = null">
        <mat-card class="detalle-panel" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>
              <span [class]="'chip-tipo chip-' + detalleTarget.tipoCambio">{{ detalleTarget.tipoCambio }}</span>
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="detalle-meta">
              @if (detalleTarget.nombreActivo) {
                <span><strong>Activo:</strong> {{ detalleTarget.nombreActivo }}</span>
              }
              @if (detalleTarget.nombreResponsable) {
                <span><strong>Responsable:</strong> {{ detalleTarget.nombreResponsable }}</span>
              }
              <span><strong>Usuario:</strong> {{ detalleTarget.usuario }}</span>
              <span><strong>Fecha:</strong> {{ detalleTarget.fechaCambio | date:'dd/MM/yyyy HH:mm:ss' }}</span>
            </div>
            <div class="desc-completa">{{ detalleTarget.descripcion }}</div>
            <div class="form-actions">
              <button mat-button type="button" (click)="detalleTarget = null">Cerrar</button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    mat-tab-group { margin-bottom: 16px; }
    .link-cell { color:#1a237e; text-decoration:none; font-weight:500; }
    .link-cell:hover { text-decoration:underline; }
    .responsable-cell { font-weight:500; }
    .desc-truncada { display:inline-block; max-width:360px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; vertical-align:middle; }
    .chip-tipo { padding:2px 8px; border-radius:10px; font-size:11px; font-weight:500; }
    .chip-Creacion               { background:#e8f5e9; color:#2e7d32; }
    .chip-Modificacion           { background:#e3f2fd; color:#1565c0; }
    .chip-CambioEstado           { background:#fff8e1; color:#f57f17; }
    .chip-AsignacionResponsable  { background:#f3e5f5; color:#6a1b9a; }
    .chip-DocumentoAdjunto       { background:#fce4ec; color:#c62828; }
    .chip-BajaResponsable        { background:#ffebee; color:#c62828; }
    .chip-ReactivacionResponsable{ background:#e0f2f1; color:#00695c; }
    .chip-Otro                   { background:#eeeeee; color:#616161; }

    .form-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:999; }
    .detalle-panel { width:520px; max-width:95vw; }
    .detalle-meta { display:flex; flex-direction:column; gap:4px; font-size:13px; color:#424242; margin:8px 0 16px; }
    .desc-completa { background:#f5f5f5; border-radius:8px; padding:12px 14px; font-size:14px; white-space:pre-wrap; }
    .form-actions { display:flex; justify-content:flex-end; margin-top:16px; }
  `]
})
export class HistorialComponent implements OnInit {
  historial: Historial[] = [];
  categoriaActual: 'activos' | 'responsables' = 'activos';
  detalleTarget: Historial | null = null;

  totalCount = 0;
  pageIndex  = 0;
  pageSize   = 20;

  private svc = inject(ReportesService);

  get columns() {
    return this.categoriaActual === 'responsables'
      ? ['referencia', 'desc', 'usuario', 'fecha', 'acciones']
      : ['referencia', 'tipo', 'desc', 'usuario', 'fecha', 'acciones'];
  }

  ngOnInit() { this.cargar(); }

  onTabChange(event: MatTabChangeEvent) {
    this.categoriaActual = event.index === 1 ? 'responsables' : 'activos';
    this.pageIndex = 0;
    this.cargar();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.cargar();
  }

  verDetalle(h: Historial) {
    this.detalleTarget = h;
  }

  cargar() {
    this.svc.getHistorialReciente(this.pageIndex + 1, this.pageSize, this.categoriaActual).subscribe(r => {
      this.historial  = r.items;
      this.totalCount = r.totalCount;
    });
  }
}
