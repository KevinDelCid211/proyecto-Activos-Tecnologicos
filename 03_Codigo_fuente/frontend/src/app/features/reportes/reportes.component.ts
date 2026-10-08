import { Component, OnInit, OnDestroy, HostListener, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { RouterLink }      from '@angular/router';
import { MatCardModule }   from '@angular/material/card';
import { MatIconModule }   from '@angular/material/icon';
import { MatTableModule }  from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule }from '@angular/material/divider';
import { MatListModule }   from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Chart, registerables } from 'chart.js';
import { ReportesService } from '../../core/services/reportes.service';
import { AuthService }     from '../../core/services/auth.service';
import { ReporteResumen, ActivoPorVencer, GastoResponsable, ReporteVulnerabilidad } from '../../core/models/models';

Chart.register(...registerables);

type ClaveReporte = 'resumen' | 'vencimientos' | 'gastos' | 'vulnerabilidades';

interface OpcionReporte {
  clave:       ClaveReporte;
  titulo:      string;
  icono:       string;
  descripcion: string;
}

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatIconModule, MatTableModule,
    MatButtonModule, MatDividerModule, MatListModule, MatTooltipModule
  ],
  template: `
    <div class="page-header no-imprimir">
      <h1>Reportes</h1>
      <button mat-raised-button color="primary" (click)="imprimir()">
        <mat-icon>print</mat-icon> Imprimir Informe
      </button>
    </div>

    <!-- ═══ Encabezado que sale únicamente en el papel ═══ -->
    <div class="encabezado-impresion">
      <div class="ei-sistema">Gestión de Activos TI</div>
      <h1 class="ei-titulo">{{ opcionActual.titulo }}</h1>
      <p class="ei-desc">{{ opcionActual.descripcion }}</p>
      <div class="ei-meta">
        <span><strong>Generado:</strong> {{ fechaImpresion | date:'dd/MM/yyyy HH:mm' }}</span>
        <span><strong>Usuario:</strong> {{ nombreUsuario }}</span>
        <span><strong>{{ etiquetaRegistros }}:</strong> {{ registrosImpresion }}</span>
      </div>
    </div>

    <div class="reportes-layout">

      <!-- ═══ Lista de reportes disponibles ═══ -->
      <mat-card class="panel-lista">
        <mat-card-header>
          <mat-card-title>Reportes disponibles</mat-card-title>
        </mat-card-header>
        <mat-divider></mat-divider>
        <mat-nav-list class="lista-reportes">
          @for (op of opciones; track op.clave) {
            <a mat-list-item
               [class.seleccionado]="op.clave === reporteActivo"
               [attr.aria-current]="op.clave === reporteActivo ? 'true' : null"
               (click)="seleccionar(op.clave)">
              <mat-icon matListItemIcon>{{ op.icono }}</mat-icon>
              <div matListItemTitle class="item-titulo">
                {{ op.titulo }}
                @if (conteo(op.clave) !== null) {
                  <span class="badge" [class.badge-alerta]="alerta(op.clave)">{{ conteo(op.clave) }}</span>
                }
              </div>
              <div matListItemLine class="item-desc">{{ op.descripcion }}</div>
            </a>
          }
        </mat-nav-list>
      </mat-card>

      <!-- ═══ Contenido del reporte seleccionado ═══ -->
      <div class="panel-contenido">
        <div class="titulo-reporte">
          <mat-icon>{{ opcionActual.icono }}</mat-icon>
          <div>
            <h2>{{ opcionActual.titulo }}</h2>
            <p>{{ opcionActual.descripcion }}</p>
          </div>
        </div>

        @switch (reporteActivo) {

          <!-- ─── Resumen general ─── -->
          @case ('resumen') {
            @if (resumen) {
              <div class="stats-grid">
                <mat-card class="stat-card">
                  <mat-card-content>
                    <div class="stat-icon" style="background:#1a237e"><mat-icon>devices</mat-icon></div>
                    <div class="stat-info"><h2>{{ resumen.totalActivos }}</h2><p>Total Activos</p></div>
                  </mat-card-content>
                </mat-card>
                <mat-card class="stat-card">
                  <mat-card-content>
                    <div class="stat-icon" style="background:#2e7d32"><mat-icon>check_circle</mat-icon></div>
                    <div class="stat-info"><h2>{{ resumen.activosActivos }}</h2><p>Activos</p></div>
                  </mat-card-content>
                </mat-card>
                <mat-card class="stat-card">
                  <mat-card-content>
                    <div class="stat-icon" style="background:#f57f17"><mat-icon>build</mat-icon></div>
                    <div class="stat-info"><h2>{{ resumen.activosMantenimiento }}</h2><p>Mantenimiento</p></div>
                  </mat-card-content>
                </mat-card>
                <mat-card class="stat-card">
                  <mat-card-content>
                    <div class="stat-icon" style="background:#6a1b9a"><mat-icon>payments</mat-icon></div>
                    <div class="stat-info"><h2>Q {{ costoTotalActivos | number:'1.0-0' }}</h2><p>Valor total registrado</p></div>
                  </mat-card-content>
                </mat-card>
              </div>

              <div class="charts-grid">
                <mat-card>
                  <mat-card-header><mat-card-title>Distribución por Tipo</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="chart-container"><canvas #chartTipo></canvas></div>
                  </mat-card-content>
                </mat-card>
                <mat-card>
                  <mat-card-header><mat-card-title>Activos por Estado</mat-card-title></mat-card-header>
                  <mat-card-content>
                    <div class="chart-container"><canvas #chartEstado></canvas></div>
                  </mat-card-content>
                </mat-card>
              </div>
            }
          }

          <!-- ─── Vencimientos próximos ─── -->
          @case ('vencimientos') {
            <mat-card>
              <mat-card-content class="table-container">
                <mat-table [dataSource]="porVencer">
                  <ng-container matColumnDef="activo">
                    <mat-header-cell *matHeaderCellDef>Activo</mat-header-cell>
                    <mat-cell *matCellDef="let a">
                      <a [routerLink]="['/activos', a.id]" class="link-cell">{{ a.nombre }}</a>
                      <small class="codigo">{{ a.codigo }}</small>
                    </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="tipo">
                    <mat-header-cell *matHeaderCellDef>Tipo</mat-header-cell>
                    <mat-cell *matCellDef="let a">{{ a.tipoActivo }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="responsable">
                    <mat-header-cell *matHeaderCellDef>Responsable</mat-header-cell>
                    <mat-cell *matCellDef="let a">{{ a.responsable || '—' }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="vencimiento">
                    <mat-header-cell *matHeaderCellDef>Vence</mat-header-cell>
                    <mat-cell *matCellDef="let a">{{ a.fechaVencimiento }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="dias">
                    <mat-header-cell *matHeaderCellDef>Días restantes</mat-header-cell>
                    <mat-cell *matCellDef="let a">
                      <span [class]="chipDias(a.diasRestantes)">
                        {{ a.diasRestantes < 0 ? 'Vencido (' + (-a.diasRestantes) + ' días)' : a.diasRestantes + ' días' }}
                      </span>
                    </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="costo">
                    <mat-header-cell *matHeaderCellDef>Costo</mat-header-cell>
                    <mat-cell *matCellDef="let a">
                      {{ a.costo != null ? ((a.moneda === 'USD' ? '$ ' : 'Q ') + (a.costo | number:'1.2-2')) : '—' }}
                    </mat-cell>
                  </ng-container>
                  <mat-header-row *matHeaderRowDef="colsVencer"></mat-header-row>
                  <mat-row *matRowDef="let row; columns: colsVencer"></mat-row>
                  <tr class="mat-row" *matNoDataRow>
                    <td class="mat-cell" [attr.colspan]="colsVencer.length" style="text-align:center;padding:24px;color:#666">
                      No hay activos próximos a vencer. ✓
                    </td>
                  </tr>
                </mat-table>
              </mat-card-content>
            </mat-card>
          }

          <!-- ─── Gastos por responsable ─── -->
          @case ('gastos') {
            <mat-card>
              <mat-card-content class="table-container">
                <mat-table [dataSource]="gastos">
                  <ng-container matColumnDef="responsable">
                    <mat-header-cell *matHeaderCellDef>Responsable</mat-header-cell>
                    <mat-cell *matCellDef="let g"><strong>{{ g.nombre }}</strong></mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="area">
                    <mat-header-cell *matHeaderCellDef>Área</mat-header-cell>
                    <mat-cell *matCellDef="let g">{{ g.area }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="cantidad">
                    <mat-header-cell *matHeaderCellDef>Activos a cargo</mat-header-cell>
                    <mat-cell *matCellDef="let g"><span class="badge-cantidad">{{ g.cantidadActivos }}</span></mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="costo">
                    <mat-header-cell *matHeaderCellDef>Costo total</mat-header-cell>
                    <mat-cell *matCellDef="let g"><strong>Q {{ g.costoTotal | number:'1.2-2' }}</strong></mat-cell>
                  </ng-container>
                  <mat-header-row *matHeaderRowDef="colsGastos"></mat-header-row>
                  <mat-row *matRowDef="let row; columns: colsGastos"></mat-row>
                </mat-table>

                @if (gastos.length > 0) {
                  <div class="total-row">
                    <span>TOTAL GENERAL</span>
                    <span>{{ totalActivosAsignados }} activos</span>
                    <span>Q {{ totalGastos | number:'1.2-2' }}</span>
                  </div>
                }
              </mat-card-content>
            </mat-card>
          }

          <!-- ─── Vulnerabilidades ─── -->
          @case ('vulnerabilidades') {
            <mat-card>
              <mat-card-content class="table-container">
                <mat-table [dataSource]="vulnerabilidades">
                  <ng-container matColumnDef="activo">
                    <mat-header-cell *matHeaderCellDef>Activo</mat-header-cell>
                    <mat-cell *matCellDef="let v">
                      <a [routerLink]="['/activos', v.activoId]" class="link-cell">{{ v.nombreActivo }}</a>
                      <small class="codigo">{{ v.codigo }}</small>
                    </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="componente">
                    <mat-header-cell *matHeaderCellDef>Componente</mat-header-cell>
                    <mat-cell *matCellDef="let v">{{ v.componente }} {{ v.version }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="motivo">
                    <mat-header-cell *matHeaderCellDef>Motivo</mat-header-cell>
                    <mat-cell *matCellDef="let v">
                      <span [class]="v.motivo === 'Vulnerabilidad declarada' ? 'chip-vuln' : 'chip-soporte'"
                            [matTooltip]="v.detalle || ''">
                        {{ v.motivo }}
                      </span>
                    </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="soporte">
                    <mat-header-cell *matHeaderCellDef>Fin de soporte</mat-header-cell>
                    <mat-cell *matCellDef="let v">{{ v.fechaFinSoporte || '—' }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="responsable">
                    <mat-header-cell *matHeaderCellDef>Responsable</mat-header-cell>
                    <mat-cell *matCellDef="let v">{{ v.responsable || '—' }}</mat-cell>
                  </ng-container>
                  <mat-header-row *matHeaderRowDef="colsVuln"></mat-header-row>
                  <mat-row *matRowDef="let row; columns: colsVuln"></mat-row>
                  <tr class="mat-row" *matNoDataRow>
                    <td class="mat-cell" [attr.colspan]="colsVuln.length" style="text-align:center;padding:24px;color:#666">
                      Sin vulnerabilidades ni fines de soporte detectados este mes. ✓
                    </td>
                  </tr>
                </mat-table>
              </mat-card-content>
            </mat-card>
          }
        }

        <!-- ═══ Pie que sale únicamente en el papel ═══ -->
        <div class="pie-impresion">
          Sistema de Gestión de Activos Tecnológicos · Informe emitido desde el módulo de reportería.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reportes-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 20px;
      align-items: start;
    }

    /* ── Lista de reportes ── */
    .panel-lista { position: sticky; top: 16px; padding-bottom: 8px; }
    .lista-reportes { padding-top: 4px; }
    .lista-reportes a[mat-list-item] {
      cursor: pointer;
      border-left: 3px solid transparent;
      transition: background .15s ease, border-color .15s ease;
      height: auto;
      padding-top: 10px;
      padding-bottom: 10px;
    }
    .lista-reportes a[mat-list-item]:hover { background: #f5f5f5; }
    .lista-reportes a.seleccionado {
      background: #e8eaf6;
      border-left-color: #1a237e;
    }
    .lista-reportes a.seleccionado .item-titulo { color: #1a237e; font-weight: 600; }
    .lista-reportes a.seleccionado mat-icon { color: #1a237e; }
    .item-titulo { display: flex; align-items: center; gap: 8px; font-size: 14px; }
    .item-desc {
      color: #757575; font-size: 12px; line-height: 1.35;
      white-space: normal; margin-top: 2px;
    }
    .badge {
      background: #e0e0e0; color: #424242;
      border-radius: 10px; padding: 1px 8px;
      font-size: 11px; font-weight: 600; line-height: 18px;
    }
    .badge-alerta { background: #ffebee; color: #c62828; }

    /* ── Encabezado del reporte ── */
    .titulo-reporte {
      display: flex; align-items: flex-start; gap: 12px;
      margin-bottom: 16px;
    }
    .titulo-reporte mat-icon {
      color: #1a237e; font-size: 30px; width: 30px; height: 30px; margin-top: 2px;
    }
    .titulo-reporte h2 { margin: 0; font-size: 20px; font-weight: 600; }
    .titulo-reporte p  { margin: 2px 0 0; color: #616161; font-size: 13.5px; }

    /* ── Contenido ── */
    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .chart-container { position: relative; height: 300px; }
    .link-cell { color: #1a237e; text-decoration: none; font-weight: 500; }
    .link-cell:hover { text-decoration: underline; }
    .codigo { color: #9e9e9e; margin-left: 6px; }
    .chip-rojo    { background:#ffebee; color:#c62828; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600; }
    .chip-ambar   { background:#fff8e1; color:#e65100; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:500; }
    .chip-verde   { background:#e8f5e9; color:#2e7d32; padding:2px 10px; border-radius:12px; font-size:12px; }
    .chip-vuln    { background:#ffebee; color:#c62828; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:500; }
    .chip-soporte { background:#fff8e1; color:#e65100; padding:2px 10px; border-radius:12px; font-size:12px; }
    .badge-cantidad { background:#e3f2fd; color:#1565c0; border-radius:10px; padding:2px 10px; font-weight:600; }
    .total-row {
      display: flex; justify-content: space-between;
      padding: 14px 16px; margin-top: 4px;
      background: #1a237e; color: white; border-radius: 8px;
      font-weight: 600; font-size: 14px;
    }

    @media (max-width: 1100px) {
      .reportes-layout { grid-template-columns: 1fr; }
      .panel-lista { position: static; }
      .charts-grid { grid-template-columns: 1fr; }
    }

    /* ── Encabezado y pie del informe impreso (ocultos en pantalla) ── */
    .encabezado-impresion,
    .pie-impresion { display: none; }

    /* ══════════════ Impresión ══════════════
       En el papel sale únicamente el reporte seleccionado, precedido
       por el encabezado del informe. */
    @media print {

      .page-header,
      .panel-lista,
      .titulo-reporte { display: none !important; }

      .reportes-layout {
        display: block;
        gap: 0;
      }

      .encabezado-impresion {
        display: block;
        border-bottom: 2px solid #1a237e;
        padding-bottom: 10px;
        margin-bottom: 18px;
      }
      .ei-sistema {
        font-size: 11px;
        letter-spacing: .12em;
        text-transform: uppercase;
        color: #1a237e;
        font-weight: 700;
      }
      .ei-titulo {
        margin: 4px 0 0;
        font-size: 21px;
        font-weight: 700;
        color: #16181d;
      }
      .ei-desc {
        margin: 3px 0 0;
        font-size: 12px;
        color: #4b5268;
      }
      .ei-meta {
        margin-top: 8px;
        display: flex;
        flex-wrap: wrap;
        gap: 4px 22px;
        font-size: 11px;
        color: #4b5268;
      }
      .ei-meta strong { color: #16181d; }

      .pie-impresion {
        display: block;
        margin-top: 18px;
        padding-top: 8px;
        border-top: 1px solid #c8ccd8;
        font-size: 10px;
        color: #6b7280;
        text-align: center;
      }

      /* Las gráficas se reparten el ancho de la hoja sin cortarse. */
      .charts-grid { grid-template-columns: 1fr 1fr; gap: 12px; }
      .chart-container { height: 235px; }
      .total-row { break-inside: avoid; page-break-inside: avoid; }

      /* Los cuatro indicadores en una fila: se reduce el bloque para que la
         cifra de valor total no desborde su tarjeta. */
      .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 14px; }
      .stat-card mat-card-content { padding: 8px 10px; gap: 9px; }
      .stat-icon { width: 36px !important; height: 36px !important; }
      .stat-icon mat-icon { font-size: 19px !important; width: 19px !important; height: 19px !important; }
      .stat-info { min-width: 0; }
      .stat-info h2 { font-size: 16px !important; line-height: 1.2; }
      .stat-info p  { font-size: 10px !important; }

      /* ── Tablas en papel ──
         mat-table reparte el ancho con flexbox; en pantalla todas las
         columnas pesan igual y algunas quedan estrechas. Aquí se les da
         un peso proporcional a lo que realmente contienen. */
      mat-table { width: 100%; font-size: 10.5px; }
      mat-header-cell, mat-cell { padding: 6px 8px !important; }
      mat-header-cell { font-size: 10.5px; font-weight: 700; color: #16181d; }
      mat-header-row  { border-bottom: 1.5px solid #1a237e !important; }
      mat-row         { border-bottom: 1px solid #e3e6ef !important; }

      .mat-column-activo       { flex: 2   1 0 !important; }
      .mat-column-componente   { flex: 1.3 1 0 !important; }
      .mat-column-motivo       { flex: 1.5 1 0 !important; }
      .mat-column-soporte      { flex: 1   1 0 !important; }
      .mat-column-responsable  { flex: 1.4 1 0 !important; }
      .mat-column-tipo         { flex: 1.1 1 0 !important; }
      .mat-column-vencimiento  { flex: 1   1 0 !important; }
      .mat-column-dias         { flex: 1.3 1 0 !important; }
      .mat-column-costo        { flex: 1.1 1 0 !important; }
      .mat-column-area         { flex: 1.2 1 0 !important; }
      .mat-column-cantidad     { flex: 0.9 1 0 !important; }

      /* El código del activo baja bajo su nombre en lugar de pegarse a él. */
      mat-cell.mat-column-activo {
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
      }
      .codigo { margin-left: 0; font-size: 9px; line-height: 1.3; }
      .chip-rojo, .chip-ambar, .chip-verde,
      .chip-vuln, .chip-soporte { font-size: 9.5px; padding: 2px 8px; }
      .badge-cantidad { font-size: 10px; }
      .table-container { overflow: visible !important; }
    }
  `]
})
export class ReportesComponent implements OnInit, OnDestroy {
  resumen?:         ReporteResumen;
  porVencer:        ActivoPorVencer[] = [];
  gastos:           GastoResponsable[] = [];
  vulnerabilidades: ReporteVulnerabilidad[] = [];

  colsVencer = ['activo','tipo','responsable','vencimiento','dias','costo'];
  colsGastos = ['responsable','area','cantidad','costo'];
  colsVuln   = ['activo','componente','motivo','soporte','responsable'];

  reporteActivo: ClaveReporte = 'resumen';

  readonly opciones: OpcionReporte[] = [
    {
      clave: 'resumen',
      titulo: 'Resumen General',
      icono: 'assessment',
      descripcion: 'Indicadores del inventario y distribución por tipo y estado.'
    },
    {
      clave: 'vencimientos',
      titulo: 'Vencimientos Próximos',
      icono: 'event_busy',
      descripcion: 'Activos cuyo vencimiento o fin de soporte está dentro de su período de aviso.'
    },
    {
      clave: 'gastos',
      titulo: 'Gastos por Responsable',
      icono: 'account_balance_wallet',
      descripcion: 'Inversión en activos agrupada por responsable actual.'
    },
    {
      clave: 'vulnerabilidades',
      titulo: 'Vulnerabilidades',
      icono: 'gpp_maybe',
      descripcion: 'Componentes con vulnerabilidad declarada o sin soporte del fabricante.'
    }
  ];

  /** Momento en que se emite el informe; se refresca en cada impresión. */
  fechaImpresion = new Date();

  @ViewChild('chartTipo')   chartTipoRef?:   ElementRef<HTMLCanvasElement>;
  @ViewChild('chartEstado') chartEstadoRef?: ElementRef<HTMLCanvasElement>;

  private charts: Chart[] = [];
  private svc  = inject(ReportesService);
  private auth = inject(AuthService);

  get opcionActual(): OpcionReporte {
    return this.opciones.find(o => o.clave === this.reporteActivo)!;
  }

  get nombreUsuario(): string {
    return this.auth.currentUser()?.nombre ?? '—';
  }

  /** El resumen no es un listado, por eso cambia la etiqueta del conteo. */
  get etiquetaRegistros(): string {
    return this.reporteActivo === 'resumen' ? 'Activos inventariados' : 'Registros';
  }

  get registrosImpresion(): number {
    return this.reporteActivo === 'resumen'
      ? (this.resumen?.totalActivos ?? 0)
      : (this.conteo(this.reporteActivo) ?? 0);
  }

  get costoTotalActivos()     { return this.gastos.reduce((s, g) => s + g.costoTotal, 0); }
  get totalGastos()           { return this.gastos.reduce((s, g) => s + g.costoTotal, 0); }
  get totalActivosAsignados() { return this.gastos.reduce((s, g) => s + g.cantidadActivos, 0); }

  ngOnInit() {
    this.svc.getResumen().subscribe(r => {
      this.resumen = r;
      if (this.reporteActivo === 'resumen') setTimeout(() => this.crearGraficas(), 0);
    });
    this.svc.getPorVencer().subscribe(v => this.porVencer = v);
    this.svc.getGastosPorResponsable().subscribe(g => this.gastos = g);
    this.svc.getVulnerabilidades().subscribe(v => this.vulnerabilidades = v);
  }

  ngOnDestroy() {
    this.destruirGraficas();
    this.quitarOrientacion();
  }

  seleccionar(clave: ClaveReporte) {
    if (clave === this.reporteActivo) return;
    this.destruirGraficas();
    this.reporteActivo = clave;
    if (clave === 'resumen' && this.resumen) setTimeout(() => this.crearGraficas(), 0);
  }

  /** Cantidad de registros del reporte, para el distintivo de la lista. */
  conteo(clave: ClaveReporte): number | null {
    switch (clave) {
      case 'vencimientos':     return this.porVencer.length;
      case 'gastos':           return this.gastos.length;
      case 'vulnerabilidades': return this.vulnerabilidades.length;
      default:                 return null;
    }
  }

  /** Los reportes de riesgo se resaltan cuando traen registros. */
  alerta(clave: ClaveReporte): boolean {
    return (clave === 'vencimientos' || clave === 'vulnerabilidades') && (this.conteo(clave) ?? 0) > 0;
  }

  chipDias(dias: number): string {
    if (dias < 0)   return 'chip-rojo';
    if (dias <= 30) return 'chip-ambar';
    return 'chip-verde';
  }

  private destruirGraficas() {
    this.charts.forEach(c => c.destroy());
    this.charts = [];
  }

  private crearGraficas() {
    if (!this.resumen || !this.chartTipoRef || !this.chartEstadoRef) return;
    this.destruirGraficas();

    const paleta = ['#1a237e', '#2e75b6', '#2e7d32', '#f57f17', '#6a1b9a', '#c62828', '#00838f'];

    this.charts.push(new Chart(this.chartTipoRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.resumen.porTipo.map(t => t.tipo),
        datasets: [{
          data: this.resumen.porTipo.map(t => t.cantidad),
          backgroundColor: paleta, borderWidth: 2, borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right' },
          tooltip: {
            callbacks: {
              label: ctx => {
                const total = this.resumen!.totalActivos;
                const pct   = ((ctx.parsed / total) * 100).toFixed(1);
                return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
              }
            }
          }
        }
      }
    }));

    this.charts.push(new Chart(this.chartEstadoRef.nativeElement, {
      type: 'bar',
      data: {
        labels: ['Activo', 'Inactivo', 'Mantenimiento', 'Retirado'],
        datasets: [{
          label: 'Cantidad de activos',
          data: [
            this.resumen.activosActivos,
            this.resumen.activosInactivos,
            this.resumen.activosMantenimiento,
            this.resumen.activosRetirados
          ],
          backgroundColor: ['#2e7d32', '#c62828', '#f57f17', '#9e9e9e'],
          borderRadius: 6, maxBarThickness: 60
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    }));
  }

  /**
   * Orientación de la hoja por reporte. El resumen se lee mejor en vertical
   * porque combina indicadores y gráficas; los tres listados llevan cinco o
   * seis columnas y necesitan el ancho de la hoja horizontal.
   */
  private readonly orientaciones: Record<ClaveReporte, 'portrait' | 'landscape'> = {
    resumen:          'portrait',
    vencimientos:     'landscape',
    gastos:           'landscape',
    vulnerabilidades: 'landscape'
  };

  private static readonly ID_ESTILO_PAGINA = 'orientacion-impresion-reportes';

  /**
   * La regla @page no responde a clases ni a media queries de componente, así
   * que la orientación se define escribiendo la regla justo antes de imprimir.
   *
   * El tamaño se declara en pulgadas explícitas y no con la palabra clave
   * "landscape": así el navegador toma unas dimensiones de hoja concretas y
   * ajusta la orientación del papel, en lugar de girar solo el contenido
   * dentro de una hoja vertical. Es la única regla @page con tamaño en toda
   * la aplicación, para que no compita con ninguna otra.
   */
  private aplicarOrientacion() {
    const id = ReportesComponent.ID_ESTILO_PAGINA;
    let estilo = document.getElementById(id) as HTMLStyleElement | null;
    if (!estilo) {
      estilo = document.createElement('style');
      estilo.id = id;
      document.head.appendChild(estilo);
    }
    // Carta: 8.5 × 11 pulgadas. Invertir las medidas es lo que define la hoja
    // horizontal, sin depender de la casilla "Diseño" del cuadro de impresión.
    const esHorizontal = this.orientaciones[this.reporteActivo] === 'landscape';
    const hoja   = esHorizontal ? '11in 8.5in'  : '8.5in 11in';
    const margen = esHorizontal ? '1.2cm 1.4cm' : '1.6cm 1.4cm';
    estilo.textContent = `@page { size: ${hoja}; margin: ${margen}; }`;
  }

  private quitarOrientacion() {
    document.getElementById(ReportesComponent.ID_ESTILO_PAGINA)?.remove();
  }

  /** Sella la hora de emisión y la orientación también con Ctrl+P. */
  @HostListener('window:beforeprint')
  onBeforePrint() {
    this.fechaImpresion = new Date();
    this.aplicarOrientacion();
  }

  imprimir() {
    this.fechaImpresion = new Date();
    this.aplicarOrientacion();
    setTimeout(() => window.print(), 0);
  }
}
