import { Component, OnInit }   from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterLink }           from '@angular/router';
import { MatCardModule }        from '@angular/material/card';
import { MatIconModule }        from '@angular/material/icon';
import { MatButtonModule }      from '@angular/material/button';
import { MatRippleModule }      from '@angular/material/core';
import { MatTableModule }       from '@angular/material/table';
import { MatChipsModule }       from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule }     from '@angular/material/tooltip';
import { ReportesService }      from '../../core/services/reportes.service';
import { ReporteResumen }       from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule, MatRippleModule,
    MatTableModule, MatChipsModule, MatProgressBarModule, MatTooltipModule
  ],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
      <button mat-raised-button color="primary" routerLink="/activos/nuevo">
        <mat-icon>add</mat-icon> Nuevo Activo
      </button>
    </div>

    @if (resumen) {
      <!-- KPI Cards -->
      <div class="stats-grid">
        <mat-card class="stat-card clickable" matRipple routerLink="/activos" matTooltip="Ver todos los activos">
          <mat-card-content>
            <div class="stat-icon" style="background:#1a237e">
              <mat-icon>devices</mat-icon>
            </div>
            <div class="stat-info">
              <h2>{{ resumen.totalActivos }}</h2>
              <p>Total de Activos</p>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card clickable" matRipple routerLink="/activos" [queryParams]="{ estado: 'Activo' }" matTooltip="Ver activos en servicio">
          <mat-card-content>
            <div class="stat-icon" style="background:#2e7d32">
              <mat-icon>check_circle</mat-icon>
            </div>
            <div class="stat-info">
              <h2>{{ resumen.activosActivos }}</h2>
              <p>Activos en Servicio</p>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card clickable" matRipple routerLink="/activos" [queryParams]="{ estado: 'Mantenimiento' }" matTooltip="Ver activos en mantenimiento">
          <mat-card-content>
            <div class="stat-icon" style="background:#f57f17">
              <mat-icon>build</mat-icon>
            </div>
            <div class="stat-info">
              <h2>{{ resumen.activosMantenimiento }}</h2>
              <p>En Mantenimiento</p>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card clickable" matRipple routerLink="/responsables" matTooltip="Ver responsables">
          <mat-card-content>
            <div class="stat-icon" style="background:#1565c0">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-info">
              <h2>{{ resumen.totalResponsables }}</h2>
              <p>Responsables</p>
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="stat-card">
          <mat-card-content>
            <div class="stat-icon" style="background:#6a1b9a">
              <mat-icon>description</mat-icon>
            </div>
            <div class="stat-info">
              <h2>{{ resumen.totalDocumentos }}</h2>
              <p>Documentos</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Alerta de vencimientos -->
      @if (resumen.activosPorVencer.length > 0) {
        <mat-card class="alerta-card">
          <mat-card-content>
            <div class="alerta-header">
              <mat-icon>warning</mat-icon>
              <strong>Activos por vencer en los próximos 30 días ({{ resumen.activosPorVencer.length }})</strong>
            </div>
            <div class="alerta-items">
              @for (a of resumen.activosPorVencer; track a.id) {
                <a class="alerta-item" [routerLink]="['/activos', a.id]">
                  <span class="alerta-nombre">{{ a.nombre }} <small>({{ a.codigo || a.tipoActivo }})</small></span>
                  <span class="alerta-dias" [class.vencido]="a.diasRestantes < 0">
                    {{ a.diasRestantes < 0
                        ? 'Vencido hace ' + (-a.diasRestantes) + ' días'
                        : a.diasRestantes === 0
                          ? 'Vence hoy'
                          : 'Vence en ' + a.diasRestantes + ' días' }}
                    — {{ a.fechaVencimiento }}
                  </span>
                </a>
              }
            </div>
          </mat-card-content>
        </mat-card>
      }

      <div class="dashboard-grid">
        <!-- Activos por tipo -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Activos por Tipo</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            @for (tipo of resumen.porTipo; track tipo.tipo) {
              <div class="tipo-row">
                <span class="tipo-label">
                  <mat-icon>{{ tipo.icono || 'device_hub' }}</mat-icon>
                  {{ tipo.tipo }}
                </span>
                <span class="tipo-count">{{ tipo.cantidad }}</span>
                <mat-progress-bar
                  mode="determinate"
                  [value]="(tipo.cantidad / resumen!.totalActivos) * 100"
                  style="flex:1; margin: 0 12px">
                </mat-progress-bar>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Últimas actividades -->
        <mat-card>
          <mat-card-header>
            <mat-card-title>Últimas Actividades</mat-card-title>
            <button mat-button color="primary" routerLink="/historial">Ver todo</button>
          </mat-card-header>
          <mat-card-content>
            <mat-table [dataSource]="resumen.ultimosMovimientos" class="compact-table">
              <ng-container matColumnDef="activo">
                <mat-header-cell *matHeaderCellDef>Activo</mat-header-cell>
                <mat-cell *matCellDef="let h">{{ h.nombreActivo || h.nombreResponsable || '—' }}</mat-cell>
              </ng-container>
              <ng-container matColumnDef="tipo">
                <mat-header-cell *matHeaderCellDef>Tipo</mat-header-cell>
                <mat-cell *matCellDef="let h">
                  <span class="chip-tipo">{{ h.tipoCambio }}</span>
                </mat-cell>
              </ng-container>
              <ng-container matColumnDef="usuario">
                <mat-header-cell *matHeaderCellDef>Usuario</mat-header-cell>
                <mat-cell *matCellDef="let h">{{ h.usuario }}</mat-cell>
              </ng-container>
              <ng-container matColumnDef="fecha">
                <mat-header-cell *matHeaderCellDef>Fecha</mat-header-cell>
                <mat-cell *matCellDef="let h">{{ h.fechaCambio | date:'dd/MM/yy HH:mm' }}</mat-cell>
              </ng-container>
              <mat-header-row *matHeaderRowDef="['activo','tipo','usuario','fecha']"></mat-header-row>
              <mat-row *matRowDef="let row; columns: ['activo','tipo','usuario','fecha']"></mat-row>
            </mat-table>
          </mat-card-content>
        </mat-card>
      </div>
    } @else {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }
  `,
  styles: [`
    .alerta-card {
      background: #fff8e1;
      border-left: 4px solid #f57f17;
      margin-bottom: 16px;
    }
    .alerta-header {
      display: flex; align-items: center; gap: 8px;
      color: #e65100; margin-bottom: 10px;
      mat-icon { color: #f57f17; }
    }
    .alerta-items { display: flex; flex-direction: column; gap: 6px; }
    .alerta-item {
      display: flex; justify-content: space-between; flex-wrap: wrap;
      text-decoration: none; color: inherit;
      padding: 6px 10px; border-radius: 6px; background: rgba(255,255,255,.6);
      &:hover { background: white; }
    }
    .alerta-nombre { font-weight: 500; small { color: #757575; font-weight: 400; } }
    .alerta-dias   { color: #e65100; font-size: 13px; }
    .alerta-dias.vencido { color: #c62828; font-weight: 600; }
    .stat-card.clickable {
      cursor: pointer;
      transition: box-shadow .15s ease, transform .15s ease;
    }
    .stat-card.clickable:hover {
      box-shadow: 0 4px 12px rgba(26, 35, 126, .15);
      transform: translateY(-1px);
    }
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 16px;
    }
    .tipo-row {
      display: flex; align-items: center; gap: 8px;
      margin-bottom: 12px;
      mat-icon { font-size: 18px; width: 18px; height: 18px; color: #1a237e; }
    }
    .tipo-label { display: flex; align-items: center; gap: 4px; min-width: 140px; font-size: 14px; }
    .tipo-count { font-weight: 700; min-width: 30px; text-align: right; }
    .chip-tipo {
      background: #e3f2fd; color: #1565c0;
      padding: 2px 8px; border-radius: 10px; font-size: 11px;
    }
    .compact-table { font-size: 13px; }
    @media (max-width: 900px) { .dashboard-grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent implements OnInit {
  resumen?: ReporteResumen;

  constructor(private reportes: ReportesService) {}

  ngOnInit() {
    this.reportes.getResumen().subscribe(r => this.resumen = r);
  }
}
