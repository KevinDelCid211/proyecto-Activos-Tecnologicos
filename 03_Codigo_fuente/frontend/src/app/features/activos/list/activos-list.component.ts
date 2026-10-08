import { Component, OnInit }      from '@angular/core';
import { CommonModule }            from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule }          from '@angular/material/table';
import { MatCardModule }           from '@angular/material/card';
import { MatButtonModule }         from '@angular/material/button';
import { MatIconModule }           from '@angular/material/icon';
import { MatFormFieldModule }      from '@angular/material/form-field';
import { MatInputModule }          from '@angular/material/input';
import { MatSelectModule }         from '@angular/material/select';
import { MatTooltipModule }        from '@angular/material/tooltip';
import { MatProgressBarModule }    from '@angular/material/progress-bar';
import { MatChipsModule }          from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ActivosService }          from '../../../core/services/activos.service';
import { ReportesService }         from '../../../core/services/reportes.service';
import { AuthService }             from '../../../core/services/auth.service';
import { ActivoList, TipoActivo }  from '../../../core/models/models';

@Component({
  selector: 'app-activos-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatTooltipModule, MatProgressBarModule, MatChipsModule, MatPaginatorModule
  ],
  template: `
    <div class="page-header">
      <h1>Activos Tecnológicos</h1>
      <button mat-raised-button color="primary" routerLink="/activos/nuevo">
        <mat-icon>add</mat-icon> Nuevo Activo
      </button>
    </div>

    <!-- Filtros -->
    <mat-card class="filter-card">
      <mat-card-content>
        <div class="form-row">
          <mat-form-field appearance="outline">
            <mat-label>Buscar</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [formControl]="busquedaCtrl" placeholder="Nombre, código o IP">
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Estado</mat-label>
            <mat-select [formControl]="estadoCtrl">
              <mat-option value="">Todos</mat-option>
              <mat-option value="Activo">Activo</mat-option>
              <mat-option value="Inactivo">Inactivo</mat-option>
              <mat-option value="Mantenimiento">Mantenimiento</mat-option>
              <mat-option value="Retirado">Retirado</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Tipo</mat-label>
            <mat-select [formControl]="tipoCtrl">
              <mat-option [value]="null">Todos</mat-option>
              @for (t of tipos; track t.id) {
                <mat-option [value]="t.id">{{ t.nombre }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Tabla -->
    <mat-card>
      <mat-card-content class="table-container">
        @if (loading) { <mat-progress-bar mode="indeterminate"></mat-progress-bar> }
        <mat-table [dataSource]="activos">
          <ng-container matColumnDef="codigo">
            <mat-header-cell *matHeaderCellDef>Código</mat-header-cell>
            <mat-cell *matCellDef="let a">{{ a.codigo || '—' }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="nombre">
            <mat-header-cell *matHeaderCellDef>Nombre</mat-header-cell>
            <mat-cell *matCellDef="let a">
              <a [routerLink]="['/activos', a.id]" class="link-cell">{{ a.nombre }}</a>
            </mat-cell>
          </ng-container>
          <ng-container matColumnDef="tipo">
            <mat-header-cell *matHeaderCellDef>Tipo</mat-header-cell>
            <mat-cell *matCellDef="let a">
              <mat-icon style="font-size:18px;vertical-align:middle;color:#1a237e">{{ a.tipoIcono || 'device_hub' }}</mat-icon>
              {{ a.tipoActivo }}
            </mat-cell>
          </ng-container>
          <ng-container matColumnDef="estado">
            <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
            <mat-cell *matCellDef="let a">
              <span [class]="'estado-chip ' + a.estado">{{ a.estado }}</span>
            </mat-cell>
          </ng-container>
          <ng-container matColumnDef="ip">
            <mat-header-cell *matHeaderCellDef>IP</mat-header-cell>
            <mat-cell *matCellDef="let a">{{ a.direccionIP || '—' }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="responsable">
            <mat-header-cell *matHeaderCellDef>Responsable</mat-header-cell>
            <mat-cell *matCellDef="let a">{{ a.responsableActual || '—' }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
            <mat-cell *matCellDef="let a">
              <button mat-icon-button [routerLink]="['/activos', a.id]" matTooltip="Ver detalle">
                <mat-icon>visibility</mat-icon>
              </button>
              @if (esAdmin) {
                <button mat-icon-button [routerLink]="['/activos', a.id, 'editar']" matTooltip="Editar">
                  <mat-icon>edit</mat-icon>
                </button>
              }
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: columns"></mat-row>
          <tr class="mat-row" *matNoDataRow>
            <td class="mat-cell" [attr.colspan]="columns.length" style="text-align:center;padding:24px">
              No se encontraron activos
            </td>
          </tr>
        </mat-table>
        <mat-paginator
          [length]="totalCount"
          [pageIndex]="pageIndex"
          [pageSize]="pageSize"
          [pageSizeOptions]="[10, 20, 50]"
          (page)="onPageChange($event)">
        </mat-paginator>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .filter-card { margin-bottom: 16px; }
    .link-cell { color: #1a237e; text-decoration: none; font-weight: 500; }
    .link-cell:hover { text-decoration: underline; }
  `]
})
export class ActivosListComponent implements OnInit {
  activos:    ActivoList[] = [];
  tipos:      TipoActivo[] = [];
  loading   = false;
  columns   = ['codigo','nombre','tipo','estado','ip','responsable','acciones'];

  totalCount = 0;
  pageIndex  = 0;
  pageSize   = 20;

  busquedaCtrl = new FormControl('');
  estadoCtrl   = new FormControl('');
  tipoCtrl     = new FormControl(null);

  constructor(
    private activosSvc:   ActivosService,
    private reportesSvc:  ReportesService,
    private route:        ActivatedRoute,
    private auth:         AuthService
  ) {}

  get esAdmin() { return this.auth.isAdmin(); }

  ngOnInit() {
    this.reportesSvc.getTiposActivo().subscribe(t => this.tipos = t);

    const estadoInicial = this.route.snapshot.queryParamMap.get('estado');
    if (estadoInicial) this.estadoCtrl.setValue(estadoInicial, { emitEvent: false });

    this.cargar();

    this.busquedaCtrl.valueChanges.pipe(debounceTime(400), distinctUntilChanged()).subscribe(() => this.reiniciarYCargar());
    this.estadoCtrl.valueChanges.subscribe(() => this.reiniciarYCargar());
    this.tipoCtrl.valueChanges.subscribe(() => this.reiniciarYCargar());
  }

  reiniciarYCargar() {
    this.pageIndex = 0;
    this.cargar();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize  = event.pageSize;
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.activosSvc.getAll(
      this.estadoCtrl.value   || undefined,
      this.tipoCtrl.value     || undefined,
      this.busquedaCtrl.value || undefined,
      this.pageIndex + 1,
      this.pageSize
    ).subscribe({
      next:  r => { this.activos = r.items; this.totalCount = r.totalCount; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
}
