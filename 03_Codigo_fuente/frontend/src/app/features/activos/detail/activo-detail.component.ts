import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule }     from '@angular/material/card';
import { MatTabsModule }     from '@angular/material/tabs';
import { MatButtonModule }   from '@angular/material/button';
import { MatIconModule }     from '@angular/material/icon';
import { MatTableModule }    from '@angular/material/table';
import { MatChipsModule }    from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule }     from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }    from '@angular/material/input';
import { MatSelectModule }   from '@angular/material/select';
import { MatTooltipModule }  from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivosService }      from '../../../core/services/activos.service';
import { ReportesService }     from '../../../core/services/reportes.service';
import { ResponsablesService } from '../../../core/services/responsables.service';
import { AuthService }         from '../../../core/services/auth.service';
import { ActivoDetail, Historial, Responsable } from '../../../core/models/models';
import { ResponsableInfoDialogComponent } from '../../../shared/components/responsable-info-dialog/responsable-info-dialog.component';

@Component({
  selector: 'app-activo-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatCardModule, MatTabsModule, MatButtonModule, MatIconModule,
    MatTableModule, MatChipsModule, MatSnackBarModule, MatListModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule,
    MatCheckboxModule, ResponsableInfoDialogComponent
  ],
  template: `
    @if (activo) {
      <div class="page-header">
        <div>
          <h1>{{ activo.nombre }}</h1>
          <span [class]="'estado-chip ' + activo.estado">{{ activo.estado }}</span>
          <small style="margin-left:8px;color:#666">{{ activo.codigo }}</small>
        </div>
        <div>
          <button mat-button routerLink="/activos"><mat-icon>arrow_back</mat-icon> Volver</button>
          <button mat-stroked-button color="primary" (click)="showSubir = true">
            <mat-icon>upload_file</mat-icon> Subir documento
          </button>
          @if (esAdmin) {
            <button mat-raised-button color="primary" [routerLink]="['/activos', activo.id, 'editar']">
              <mat-icon>edit</mat-icon> Editar
            </button>
          }
        </div>
      </div>

      <mat-card>
        <mat-card-content>
          <mat-tab-group>
            <!-- Tab: Información General -->
            <mat-tab label="Información General">
              <div class="tab-content">
                <div class="info-grid">
                  <div class="info-item"><span class="label">Tipo</span><span>{{ activo.tipoActivo }}</span></div>
                  <div class="info-item"><span class="label">Ubicación</span><span>{{ activo.ubicacion || '—' }}</span></div>
                  <div class="info-item"><span class="label">Dirección IP</span><span>{{ activo.direccionIP || '—' }}</span></div>
                  <div class="info-item"><span class="label">SO</span><span>{{ activo.sistemaOperativo || '—' }}</span></div>
                  <div class="info-item"><span class="label">Versión</span><span>{{ activo.version || '—' }}</span></div>
                  <div class="info-item"><span class="label">Adquisición</span><span>{{ activo.fechaAdquisicion || '—' }}</span></div>
                  <div class="info-item"><span class="label">Vencimiento</span><span>{{ activo.fechaVencimiento || '—' }}</span></div>
                  <div class="info-item">
                    <span class="label">Costo</span>
                    <span>{{ activo.costo != null ? ((activo.moneda === 'USD' ? '$ ' : 'Q ') + (activo.costo | number:'1.2-2')) : '—' }}</span>
                  </div>
                  <div class="info-item"><span class="label">Aviso de vencimiento</span><span>{{ activo.diasAvisoVencimiento }} días antes</span></div>
                  <div class="info-item">
                    <span class="label">Responsable</span>
                    @if (responsableActualId) {
                      <button class="responsable-link" type="button" (click)="verDetalleDe(responsableActualId)">
                        {{ activo.responsableActual }}
                        <mat-icon>visibility</mat-icon>
                      </button>
                    } @else {
                      <span>{{ activo.responsableActual || '—' }}</span>
                    }
                  </div>
                  <div class="info-item"><span class="label">Creado por</span><span>{{ activo.usuarioCreador }}</span></div>
                  <div class="info-item"><span class="label">Fecha creación</span><span>{{ activo.fechaCreacion | date:'dd/MM/yyyy' }}</span></div>
                </div>
                @if (activo.descripcion) {
                  <div class="desc-box">
                    <h4>Descripción</h4>
                    <p>{{ activo.descripcion }}</p>
                  </div>
                }
                @if (activo.observaciones) {
                  <div class="desc-box">
                    <h4>Observaciones</h4>
                    <p>{{ activo.observaciones }}</p>
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Tab: Responsables -->
            <mat-tab [label]="'Responsables (' + activo.responsables.length + ')'">
              <div class="tab-content">
                <div class="tab-actions">
                  <button mat-raised-button color="primary" (click)="showAsignar = true">
                    <mat-icon>person_add</mat-icon> Asignar responsable
                  </button>
                </div>
                <mat-table [dataSource]="activo.responsables">
                  <ng-container matColumnDef="nombre">
                    <mat-header-cell *matHeaderCellDef>Nombre</mat-header-cell>
                    <mat-cell *matCellDef="let r">{{ r.nombre }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="area">
                    <mat-header-cell *matHeaderCellDef>Área</mat-header-cell>
                    <mat-cell *matCellDef="let r">{{ r.area }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="cargo">
                    <mat-header-cell *matHeaderCellDef>Cargo</mat-header-cell>
                    <mat-cell *matCellDef="let r">{{ r.cargo || '—' }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="desde">
                    <mat-header-cell *matHeaderCellDef>Desde</mat-header-cell>
                    <mat-cell *matCellDef="let r">{{ r.fechaInicio }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="estado">
                    <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
                    <mat-cell *matCellDef="let r">
                      <span [style.color]="r.esActual ? '#2e7d32' : '#9e9e9e'">
                        {{ r.esActual ? '✓ Actual' : 'Anterior' }}
                      </span>
                    </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="acciones">
                    <mat-header-cell *matHeaderCellDef></mat-header-cell>
                    <mat-cell *matCellDef="let r">
                      <button mat-icon-button (click)="verDetalleDe(r.responsableId)" matTooltip="Ver datos del responsable">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </mat-cell>
                  </ng-container>
                  <mat-header-row *matHeaderRowDef="['nombre','area','cargo','desde','estado','acciones']"></mat-header-row>
                  <mat-row *matRowDef="let row; columns: ['nombre','area','cargo','desde','estado','acciones']"></mat-row>
                </mat-table>
              </div>
            </mat-tab>

            <!-- Tab: Documentos -->
            <mat-tab [label]="'Documentos (' + activo.documentos.length + ')'">
              <div class="tab-content">
                <div class="tab-actions">
                  <button mat-raised-button color="primary" (click)="showSubir = true">
                    <mat-icon>upload_file</mat-icon> Subir documento
                  </button>
                </div>
                <mat-list>
                  @for (doc of activo.documentos; track doc.id) {
                    <mat-list-item>
                      <mat-icon matListItemIcon>description</mat-icon>
                      <span matListItemTitle>{{ doc.nombre }}</span>
                      <span matListItemLine>{{ doc.tipoDocumento }} — {{ doc.fechaSubida | date:'dd/MM/yyyy' }} — {{ doc.usuarioSubida }}</span>
                      <span matListItemMeta>
                        <a mat-icon-button [href]="doc.urlDescarga" target="_blank" matTooltip="Descargar">
                          <mat-icon>download</mat-icon>
                        </a>
                        @if (esAdmin) {
                          <button mat-icon-button (click)="eliminarDocumento(doc.id)" matTooltip="Eliminar">
                            <mat-icon color="warn">delete</mat-icon>
                          </button>
                        }
                      </span>
                    </mat-list-item>
                  } @empty {
                    <p style="padding:16px;color:#666">No hay documentos adjuntos</p>
                  }
                </mat-list>
              </div>
            </mat-tab>

            <!-- Tab: Componentes tecnológicos -->
            <mat-tab [label]="'Componentes (' + activo.componentes.length + ')'">
              <div class="tab-content">
                <div class="tab-actions">
                  <button mat-raised-button color="primary" (click)="abrirComponente()">
                    <mat-icon>add_circle</mat-icon> Agregar componente
                  </button>
                </div>
                <mat-table [dataSource]="activo.componentes">
                  <ng-container matColumnDef="nombre">
                    <mat-header-cell *matHeaderCellDef>Tecnología</mat-header-cell>
                    <mat-cell *matCellDef="let c">
                      <mat-icon class="comp-icon">memory</mat-icon>
                      <strong>{{ c.nombre }}</strong>
                    </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="version">
                    <mat-header-cell *matHeaderCellDef>Versión</mat-header-cell>
                    <mat-cell *matCellDef="let c">{{ c.version || '—' }}</mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="vulnerabilidad">
                    <mat-header-cell *matHeaderCellDef>Vulnerabilidad</mat-header-cell>
                    <mat-cell *matCellDef="let c">
                      @if (c.tieneVulnerabilidad) {
                        <span class="chip-vuln" [matTooltip]="c.detalleVulnerabilidad || ''">
                          <mat-icon>warning</mat-icon> Sí
                        </span>
                      } @else {
                        <span class="chip-ok"><mat-icon>check_circle</mat-icon> No</span>
                      }
                    </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="soporte">
                    <mat-header-cell *matHeaderCellDef>Fin de soporte</mat-header-cell>
                    <mat-cell *matCellDef="let c">
                      <span [class.soporte-vencido]="soporteVencido(c.fechaFinSoporte)">
                        {{ c.fechaFinSoporte || '—' }}
                      </span>
                    </mat-cell>
                  </ng-container>
                  <ng-container matColumnDef="acciones">
                    <mat-header-cell *matHeaderCellDef></mat-header-cell>
                    <mat-cell *matCellDef="let c">
                      <button mat-icon-button (click)="abrirComponente(c)" matTooltip="Editar">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button (click)="eliminarComponente(c)" matTooltip="Eliminar">
                        <mat-icon color="warn">delete</mat-icon>
                      </button>
                    </mat-cell>
                  </ng-container>
                  <mat-header-row *matHeaderRowDef="['nombre','version','vulnerabilidad','soporte','acciones']"></mat-header-row>
                  <mat-row *matRowDef="let row; columns: ['nombre','version','vulnerabilidad','soporte','acciones']"></mat-row>
                  <tr class="mat-row" *matNoDataRow>
                    <td class="mat-cell" colspan="5" style="text-align:center;padding:24px;color:#666">
                      Sin componentes registrados. Agrega las tecnologías con las que está construido este activo (ej. Angular, Node.js, SQL Server).
                    </td>
                  </tr>
                </mat-table>
              </div>
            </mat-tab>

          </mat-tab-group>
        </mat-card-content>
      </mat-card>

      <!-- Tarjeta: Historial de cambios de este activo (siempre visible, sin pestaña) -->
      <mat-card class="historial-card">
        <mat-card-header>
          <mat-card-title>Cambios realizados sobre este activo</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-table [dataSource]="historial">
            <ng-container matColumnDef="tipo">
              <mat-header-cell *matHeaderCellDef>Tipo</mat-header-cell>
              <mat-cell *matCellDef="let h"><span class="chip-tipo">{{ h.tipoCambio }}</span></mat-cell>
            </ng-container>
            <ng-container matColumnDef="desc">
              <mat-header-cell *matHeaderCellDef>Descripción</mat-header-cell>
              <mat-cell *matCellDef="let h">{{ h.descripcion }}</mat-cell>
            </ng-container>
            <ng-container matColumnDef="usuario">
              <mat-header-cell *matHeaderCellDef>Usuario</mat-header-cell>
              <mat-cell *matCellDef="let h">{{ h.usuario }}</mat-cell>
            </ng-container>
            <ng-container matColumnDef="fecha">
              <mat-header-cell *matHeaderCellDef>Fecha</mat-header-cell>
              <mat-cell *matCellDef="let h">{{ h.fechaCambio | date:'dd/MM/yyyy HH:mm' }}</mat-cell>
            </ng-container>
            <ng-container matColumnDef="acciones">
              <mat-header-cell *matHeaderCellDef></mat-header-cell>
              <mat-cell *matCellDef="let h">
                <button mat-icon-button (click)="verDetalleHistorial(h)" matTooltip="Ver comentario completo">
                  <mat-icon>visibility</mat-icon>
                </button>
              </mat-cell>
            </ng-container>
            <mat-header-row *matHeaderRowDef="['tipo','desc','usuario','fecha','acciones']"></mat-header-row>
            <mat-row *matRowDef="let row; columns: ['tipo','desc','usuario','fecha','acciones']"></mat-row>
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="5" style="text-align:center;padding:24px;color:#666">
                Sin cambios registrados todavía
              </td>
            </tr>
          </mat-table>
        </mat-card-content>
      </mat-card>

      <!-- Panel: Asignar responsable -->
      @if (showAsignar) {
        <div class="form-overlay">
          <mat-card class="form-panel">
            <mat-card-header>
              <mat-card-title>Asignar responsable</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="asignarForm" (ngSubmit)="asignarResponsable()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Responsable *</mat-label>
                  <mat-select formControlName="responsableId">
                    @for (r of responsablesDisponibles; track r.id) {
                      <mat-option [value]="r.id">{{ r.nombre }} — {{ r.area }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Fecha de inicio *</mat-label>
                  <input matInput type="date" formControlName="fechaInicio">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Notas</mat-label>
                  <textarea matInput formControlName="notas" rows="2"></textarea>
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="showAsignar = false">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit"
                          [disabled]="asignarForm.invalid || guardando">
                    Asignar
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Panel: Subir documento -->
      @if (showSubir) {
        <div class="form-overlay">
          <mat-card class="form-panel">
            <mat-card-header>
              <mat-card-title>Subir documento</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="subirForm" (ngSubmit)="subirDocumento()">
                <div class="file-picker">
                  <button mat-stroked-button type="button" (click)="fileInput.click()">
                    <mat-icon>attach_file</mat-icon>
                    {{ archivoSeleccionado?.name || 'Seleccionar archivo' }}
                  </button>
                  <input hidden type="file" #fileInput
                         accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt"
                         (change)="onFileSelected($event)">
                  <small>Máximo 10 MB — pdf, doc, xls, imagen, txt</small>
                </div>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Tipo de documento *</mat-label>
                  <mat-select formControlName="tipo">
                    @for (t of tiposDocumento; track t) {
                      <mat-option [value]="t">{{ t }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Descripción</mat-label>
                  <textarea matInput formControlName="descripcion" rows="2"></textarea>
                </mat-form-field>
                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelarSubida()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit"
                          [disabled]="subirForm.invalid || !archivoSeleccionado || guardando">
                    {{ guardando ? 'Subiendo...' : 'Subir' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <!-- Panel: Agregar/editar componente -->
      @if (showComponente) {
        <div class="form-overlay">
          <mat-card class="form-panel">
            <mat-card-header>
              <mat-card-title>{{ componenteEditandoId ? 'Editar' : 'Agregar' }} componente</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form [formGroup]="componenteForm" (ngSubmit)="guardarComponente()">
                <div class="form-row-2">
                  <mat-form-field appearance="outline">
                    <mat-label>Tecnología</mat-label>
                    <input matInput formControlName="nombre" placeholder="Angular, Node.js, SQL Server...">
                  </mat-form-field>
                  <mat-form-field appearance="outline">
                    <mat-label>Versión</mat-label>
                    <input matInput formControlName="version" placeholder="17.3">
                  </mat-form-field>
                </div>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Fin de soporte (EOL)</mat-label>
                  <input matInput type="date" formControlName="fechaFinSoporte">
                  <mat-hint>Fecha en que el fabricante deja de dar mantenimiento</mat-hint>
                </mat-form-field>
                <div class="vuln-check">
                  <mat-checkbox formControlName="tieneVulnerabilidad">
                    Tiene vulnerabilidad conocida
                  </mat-checkbox>
                </div>
                @if (componenteForm.value.tieneVulnerabilidad) {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Detalle de la vulnerabilidad</mat-label>
                    <textarea matInput formControlName="detalleVulnerabilidad" rows="3"
                              placeholder="Ej. CVE-2024-XXXX, versión sin soporte, requiere actualización a..."></textarea>
                  </mat-form-field>
                }
                <div class="form-actions">
                  <button mat-button type="button" (click)="cancelarComponente()">Cancelar</button>
                  <button mat-raised-button color="primary" type="submit"
                          [disabled]="componenteForm.invalid || guardando">
                    {{ guardando ? 'Guardando...' : 'Guardar' }}
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </div>
      }

      <app-responsable-info-dialog [responsable]="verDetalleResponsable" (cerrar)="verDetalleResponsable = null"></app-responsable-info-dialog>

      <!-- Panel: detalle del comentario/cambio del historial -->
      @if (detalleHistorial) {
        <div class="form-overlay" (click)="detalleHistorial = null">
          <mat-card class="detalle-panel" (click)="$event.stopPropagation()">
            <mat-card-header>
              <mat-card-title>
                <span class="chip-tipo">{{ detalleHistorial.tipoCambio }}</span>
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="detalle-meta">
                <span><strong>Usuario:</strong> {{ detalleHistorial.usuario }}</span>
                <span><strong>Fecha:</strong> {{ detalleHistorial.fechaCambio | date:'dd/MM/yyyy HH:mm:ss' }}</span>
              </div>
              <div class="desc-completa">{{ detalleHistorial.descripcion }}</div>
              <div class="form-actions">
                <button mat-button type="button" (click)="detalleHistorial = null">Cerrar</button>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      }
    }
  `,
  styles: [`
    .tab-content { padding: 16px 0; }
    .historial-card { margin-top: 16px; }
    .tab-actions { display: flex; justify-content: flex-end; margin-bottom: 12px; }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px; margin-bottom: 16px;
    }
    .info-item {
      display: flex; flex-direction: column;
      .label { font-size: 11px; color: #757575; text-transform: uppercase; font-weight: 500; }
      span:last-child { font-size: 15px; margin-top: 2px; }
    }
    .desc-box { background: #f5f5f5; border-radius: 8px; padding: 12px 16px; margin-top: 12px;
      h4 { margin: 0 0 6px; color: #1a237e; } p { margin: 0; } }
    .chip-tipo { background: #e3f2fd; color: #1565c0; padding: 2px 8px; border-radius: 10px; font-size: 11px; }
    .form-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4);
      display: flex; align-items: center; justify-content: center; z-index: 999; }
    .form-panel { width: 480px; max-width: 95vw; }
    .full-width { width: 100%; }
    .file-picker { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px;
      small { color: #757575; } }
    .responsable-link {
      display: inline-flex; align-items: center; gap: 4px;
      background: none; border: none; padding: 0; cursor: pointer;
      color: #1a237e; font-size: 15px; font-weight: 500; text-align: left;
      mat-icon { font-size: 16px; width: 16px; height: 16px; color: #757575; }
    }
    .responsable-link:hover { text-decoration: underline; }
    .comp-icon { font-size: 18px; width: 18px; height: 18px; color: #1a237e; margin-right: 6px; vertical-align: middle; }
    .chip-vuln, .chip-ok {
      display: inline-flex; align-items: center; gap: 4px;
      padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 500;
      mat-icon { font-size: 15px; width: 15px; height: 15px; }
    }
    .chip-vuln { background: #ffebee; color: #c62828; }
    .chip-ok   { background: #e8f5e9; color: #2e7d32; }
    .soporte-vencido { color: #c62828; font-weight: 600; }
    .vuln-check { margin: 4px 0 12px; }
    .form-row-2 { display: flex; gap: 12px; flex-wrap: wrap;
      mat-form-field { flex: 1; min-width: 160px; } }
    .detalle-panel { width: 520px; max-width: 95vw; }
    .detalle-meta { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: #424242; margin: 8px 0 16px; }
    .desc-completa { background: #f5f5f5; border-radius: 8px; padding: 12px 14px; font-size: 14px; white-space: pre-wrap; }
  `]
})
export class ActivoDetailComponent implements OnInit {
  activo?:   ActivoDetail;
  historial: Historial[] = [];
  responsablesDisponibles: Responsable[] = [];
  verDetalleResponsable: Responsable | null = null;
  detalleHistorial: Historial | null = null;

  showAsignar = false;
  showSubir   = false;
  showComponente = false;
  componenteEditandoId: number | null = null;
  guardando   = false;
  archivoSeleccionado?: File;

  asignarForm!:    FormGroup;
  subirForm!:      FormGroup;
  componenteForm!: FormGroup;

  tiposDocumento = ['Manual','Licencia','Configuracion','Contrato','Certificado','SolicitudAdministrativa','Otro'];

  private route        = inject(ActivatedRoute);
  private activos      = inject(ActivosService);
  private reportes     = inject(ReportesService);
  private responsables = inject(ResponsablesService);
  private auth         = inject(AuthService);
  private fb           = inject(FormBuilder);
  private snack        = inject(MatSnackBar);

  get esAdmin() { return this.auth.isAdmin(); }
  private get activoId() { return +this.route.snapshot.params['id']; }

  get responsableActualId(): number | null {
    return this.activo?.responsables.find(r => r.esActual)?.responsableId ?? null;
  }

  verDetalleDe(responsableId: number) {
    this.responsables.getById(responsableId).subscribe(r => this.verDetalleResponsable = r);
  }

  verDetalleHistorial(h: Historial) {
    this.detalleHistorial = h;
  }

  ngOnInit() {
    this.asignarForm = this.fb.group({
      responsableId: [null, Validators.required],
      fechaInicio:   [new Date().toISOString().substring(0, 10), Validators.required],
      notas:         [''],
    });
    this.subirForm = this.fb.group({
      tipo:        [null, Validators.required],
      descripcion: [''],
    });
    this.componenteForm = this.fb.group({
      nombre:                ['', Validators.required],
      version:               [''],
      fechaFinSoporte:       [null],
      tieneVulnerabilidad:   [false],
      detalleVulnerabilidad: [''],
    });

    this.cargar();
    this.responsables.getAll(true).subscribe(r => this.responsablesDisponibles = r);
  }

  cargar() {
    this.activos.getById(this.activoId).subscribe(a => this.activo = a);
    this.reportes.getHistorialActivo(this.activoId).subscribe(h => this.historial = h);
  }

  asignarResponsable() {
    if (this.asignarForm.invalid) return;
    this.guardando = true;
    this.activos.asignarResponsable({
      activoId: this.activoId,
      ...this.asignarForm.value
    }).subscribe({
      next: () => {
        this.snack.open('Responsable asignado correctamente', 'OK', { duration: 3000 });
        this.showAsignar = false;
        this.guardando   = false;
        this.asignarForm.patchValue({ responsableId: null, notas: '' });
        this.cargar();
      },
      error: () => { this.guardando = false; }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.archivoSeleccionado = input.files[0];
  }

  subirDocumento() {
    if (this.subirForm.invalid || !this.archivoSeleccionado) return;
    this.guardando = true;
    const { tipo, descripcion } = this.subirForm.value;
    this.activos.subirDocumento(this.activoId, this.archivoSeleccionado, tipo, descripcion).subscribe({
      next: () => {
        this.snack.open('Documento subido correctamente', 'OK', { duration: 3000 });
        this.cancelarSubida();
        this.cargar();
      },
      error: () => { this.guardando = false; }
    });
  }

  cancelarSubida() {
    this.showSubir = false;
    this.guardando = false;
    this.archivoSeleccionado = undefined;
    this.subirForm.reset();
  }

  eliminarDocumento(id: number) {
    if (!confirm('¿Eliminar este documento?')) return;
    this.activos.eliminarDocumento(id).subscribe(() => {
      this.snack.open('Documento eliminado', 'OK', { duration: 3000 });
      this.cargar();
    });
  }

  // ── Componentes tecnológicos ────────────────────────────
  soporteVencido(fecha?: string): boolean {
    if (!fecha) return false;
    return new Date(fecha) < new Date();
  }

  abrirComponente(c?: { id: number; nombre: string; version?: string; fechaFinSoporte?: string;
                        tieneVulnerabilidad: boolean; detalleVulnerabilidad?: string }) {
    this.componenteEditandoId = c?.id ?? null;
    this.componenteForm.reset({
      nombre:                c?.nombre ?? '',
      version:               c?.version ?? '',
      fechaFinSoporte:       c?.fechaFinSoporte ?? null,
      tieneVulnerabilidad:   c?.tieneVulnerabilidad ?? false,
      detalleVulnerabilidad: c?.detalleVulnerabilidad ?? '',
    });
    this.showComponente = true;
  }

  cancelarComponente() {
    this.showComponente = false;
    this.componenteEditandoId = null;
  }

  guardarComponente() {
    if (this.componenteForm.invalid) return;
    this.guardando = true;
    const dto = { ...this.componenteForm.value };
    if (!dto.tieneVulnerabilidad) dto.detalleVulnerabilidad = null;

    const obs = this.componenteEditandoId
      ? this.activos.actualizarComponente(this.activoId, this.componenteEditandoId, dto)
      : this.activos.agregarComponente(this.activoId, dto);

    obs.subscribe({
      next: () => {
        this.snack.open(`Componente ${this.componenteEditandoId ? 'actualizado' : 'agregado'} correctamente`, 'OK', { duration: 3000 });
        this.guardando = false;
        this.cancelarComponente();
        this.cargar();
      },
      error: () => { this.guardando = false; }
    });
  }

  eliminarComponente(c: { id: number; nombre: string }) {
    if (!confirm(`¿Eliminar el componente ${c.nombre}?`)) return;
    this.activos.eliminarComponente(this.activoId, c.id).subscribe(() => {
      this.snack.open('Componente eliminado', 'OK', { duration: 3000 });
      this.cargar();
    });
  }
}
