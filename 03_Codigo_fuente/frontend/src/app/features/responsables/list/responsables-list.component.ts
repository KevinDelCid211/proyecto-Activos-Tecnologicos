import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { RouterLink }                 from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule }  from '@angular/material/table';
import { MatCardModule }   from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }  from '@angular/material/input';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule }  from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { ResponsablesService } from '../../../core/services/responsables.service';
import { ActivosService }      from '../../../core/services/activos.service';
import { AuthService }         from '../../../core/services/auth.service';
import { Responsable, ActivoList } from '../../../core/models/models';
import { ResponsableInfoDialogComponent } from '../../../shared/components/responsable-info-dialog/responsable-info-dialog.component';

@Component({
  selector: 'app-responsables-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatTableModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatDialogModule, MatSnackBarModule,
    MatTooltipModule, MatChipsModule, MatProgressBarModule, MatSelectModule,
    ResponsableInfoDialogComponent
  ],
  template: `
    <div class="page-header">
      <h1>Responsables</h1>
      <button mat-raised-button color="primary" (click)="abrirFormulario()">
        <mat-icon>person_add</mat-icon> Nuevo Responsable
      </button>
    </div>

    <mat-card>
      <mat-card-content class="table-container">
        <mat-table [dataSource]="responsables" multiTemplateDataRows>
          <ng-container matColumnDef="nombre">
            <mat-header-cell *matHeaderCellDef>Nombre</mat-header-cell>
            <mat-cell *matCellDef="let r">
              <strong>{{ r.nombre }}</strong>
              @if (r.contactoRespaldoNombre) {
                <mat-icon class="respaldo-icon"
                  [matTooltip]="'Respaldo: ' + r.contactoRespaldoNombre + (r.contactoRespaldoEmail ? ' (' + r.contactoRespaldoEmail + ')' : '')">
                  swap_horiz
                </mat-icon>
              }
            </mat-cell>
          </ng-container>
          <ng-container matColumnDef="area">
            <mat-header-cell *matHeaderCellDef>Área</mat-header-cell>
            <mat-cell *matCellDef="let r">{{ r.area }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="cargo">
            <mat-header-cell *matHeaderCellDef>Cargo</mat-header-cell>
            <mat-cell *matCellDef="let r">{{ r.cargo || '—' }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="email">
            <mat-header-cell *matHeaderCellDef>Email</mat-header-cell>
            <mat-cell *matCellDef="let r">{{ r.email }}</mat-cell>
          </ng-container>
          <ng-container matColumnDef="activos">
            <mat-header-cell *matHeaderCellDef>Activos asignados</mat-header-cell>
            <mat-cell *matCellDef="let r">
              <button class="badge-activos-btn" [disabled]="r.totalActivos === 0" (click)="toggleExpand(r)">
                <span class="badge-activos">{{ r.totalActivos }}</span>
                @if (r.totalActivos > 0) {
                  <mat-icon>{{ expandedId === r.id ? 'expand_less' : 'expand_more' }}</mat-icon>
                }
              </button>
            </mat-cell>
          </ng-container>
          <ng-container matColumnDef="estado">
            <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
            <mat-cell *matCellDef="let r">
              <span [class]="r.activo ? 'chip-activo' : 'chip-inactivo'">
                {{ r.activo ? 'Activo' : 'Inactivo' }}
              </span>
              @if (r.observaciones) {
                <mat-icon class="obs-icon" [matTooltip]="r.observaciones">info_outline</mat-icon>
              }
            </mat-cell>
          </ng-container>
          <ng-container matColumnDef="acciones">
            <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
            <mat-cell *matCellDef="let r">
              <button mat-icon-button (click)="verDetalle(r)" matTooltip="Ver datos">
                <mat-icon>visibility</mat-icon>
              </button>
              @if (r.activo) {
                @if (esAdmin) {
                  <button mat-icon-button (click)="editar(r)" matTooltip="Editar">
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button mat-icon-button (click)="abrirDesactivar(r)" matTooltip="Desactivar">
                    <mat-icon>person_off</mat-icon>
                  </button>
                }
              } @else if (esAdmin) {
                <button mat-icon-button (click)="abrirReactivar(r)" matTooltip="Reactivar">
                  <mat-icon>person</mat-icon>
                </button>
              }
            </mat-cell>
          </ng-container>

          <!-- Fila de detalle: activos asignados al responsable expandido -->
          <ng-container matColumnDef="expand">
            <mat-cell *matCellDef="let r" class="detail-cell">
              <div class="detail-panel">
                <div class="detail-card">
                  <div class="detail-card-header">
                    <mat-icon>devices</mat-icon>
                    <span>Activos asignados a <strong>{{ r.nombre }}</strong></span>
                  </div>
                  @if (loadingActivos) {
                    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
                  } @else if (activosAsignados.length === 0) {
                    <p class="empty-msg">Sin activos asignados actualmente.</p>
                  } @else {
                    <ul class="activos-list">
                      @for (a of activosAsignados; track a.id) {
                        <li>
                          <a [routerLink]="['/activos', a.id]">
                            <mat-icon>{{ a.tipoIcono || 'device_hub' }}</mat-icon>
                            <span class="a-nombre">{{ a.nombre }}</span>
                            <span class="a-codigo">{{ a.codigo || '—' }}</span>
                            <span [class]="'estado-chip ' + a.estado">{{ a.estado }}</span>
                          </a>
                          <button mat-icon-button (click)="abrirReasignarActivo(a)" matTooltip="Reasignar a otro responsable">
                            <mat-icon>swap_horiz</mat-icon>
                          </button>
                        </li>
                      }
                    </ul>
                  }
                </div>
              </div>
            </mat-cell>
          </ng-container>

          <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
          <mat-row *matRowDef="let row; columns: columns"></mat-row>
          <mat-row *matRowDef="let row; columns: ['expand']"
                   class="detail-row" [class.detail-row-hidden]="expandedId !== row.id"></mat-row>
        </mat-table>
      </mat-card-content>
    </mat-card>

    <!-- Formulario inline (dialog simple) -->
    @if (showForm) {
      <div class="form-overlay">
        <mat-card class="form-panel">
          <mat-card-header>
            <mat-card-title>{{ editingId ? 'Editar' : 'Nuevo' }} Responsable</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="form" (ngSubmit)="guardar()">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre</mat-label>
                  <input matInput formControlName="nombre">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Área</mat-label>
                  <input matInput formControlName="area">
                </mat-form-field>
              </div>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Cargo</mat-label>
                  <input matInput formControlName="cargo">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email">
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline">
                <mat-label>Teléfono</mat-label>
                <input matInput formControlName="telefono">
              </mat-form-field>

              <h4 class="subsection-title">Contacto de respaldo <span>(vacaciones o ausencias)</span></h4>
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>Nombre</mat-label>
                  <input matInput formControlName="contactoRespaldoNombre">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Correo</mat-label>
                  <input matInput type="email" formControlName="contactoRespaldoEmail">
                </mat-form-field>
              </div>

              <div class="form-actions">
                <button mat-button type="button" (click)="cancelar()">Cancelar</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">
                  Guardar
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <!-- Panel: Confirmar contraseña (paso previo a desactivar/reactivar) -->
    @if (showPasswordGate && passwordGateTarget) {
      <div class="form-overlay">
        <mat-card class="form-panel password-gate-panel">
          <mat-card-header>
            <mat-card-title>Confirma tu contraseña</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="aviso-activos">
              Por seguridad, escribe tu contraseña de administrador para
              {{ passwordGateAction === 'reactivar' ? 'reactivar' : 'dar de baja' }} a {{ passwordGateTarget.nombre }}.
            </p>
            <form [formGroup]="passwordGateForm" (ngSubmit)="confirmarPasswordGate()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tu contraseña</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="current-password">
              </mat-form-field>
              @if (passwordGateError) {
                <p class="error-msg">{{ passwordGateError }}</p>
              }
              <div class="form-actions">
                <button mat-button type="button" (click)="cancelarPasswordGate()">Cancelar</button>
                <button mat-raised-button color="primary" type="submit"
                        [disabled]="passwordGateForm.invalid || verifyingPassword">
                  {{ verifyingPassword ? 'Verificando...' : 'Continuar' }}
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <!-- Panel: Dar de baja -->
    @if (showDesactivar && desactivarTarget) {
      <div class="form-overlay">
        <mat-card class="form-panel">
          <mat-card-header>
            <mat-card-title>Dar de baja a {{ desactivarTarget.nombre }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="aviso-permanente">
              <mat-icon>warning</mat-icon>
              <span>Dar de baja únicamente a las personas que se desvinculen de la empresa. <strong>No será posible reactivar un usuario</strong> — habilitarlo de nuevo solo estará disponible para el usuario administrador.</span>
            </div>
            <form [formGroup]="desactivarForm" (ngSubmit)="confirmarDesactivar()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Observación</mat-label>
                <textarea matInput formControlName="observacion" rows="4"
                          placeholder="Describe el motivo de la baja (ej. renuncia, fin de contrato)"></textarea>
              </mat-form-field>

              @if (desactivarTarget.totalActivos > 0) {
                <p class="aviso-activos">
                  Tiene <strong>{{ desactivarTarget.totalActivos }}</strong> activo(s) asignado(s). ¿Qué hacemos con ellos?
                </p>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Acción sobre sus activos</mat-label>
                  <mat-select formControlName="accion">
                    <mat-option value="sin_responsable">Dejarlos sin responsable asignado</mat-option>
                    <mat-option value="reasignar">Reasignarlos a otro responsable</mat-option>
                  </mat-select>
                </mat-form-field>

                @if (desactivarForm.value.accion === 'reasignar') {
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nuevo responsable</mat-label>
                    <mat-select formControlName="nuevoResponsableId">
                      @for (r of responsablesParaReasignar; track r.id) {
                        <mat-option [value]="r.id">{{ r.nombre }} — {{ r.area }}</mat-option>
                      }
                    </mat-select>
                  </mat-form-field>
                }
              }

              <div class="form-actions">
                <button mat-button type="button" (click)="cancelarDesactivar()">Cancelar</button>
                <button mat-raised-button color="warn" type="submit"
                        [disabled]="desactivarForm.invalid || (desactivarForm.value.accion === 'reasignar' && !desactivarForm.value.nuevoResponsableId)">
                  Confirmar baja
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <!-- Panel: Reasignar un activo individual -->
    @if (showReasignarActivo && reasignarActivoTarget) {
      <div class="form-overlay">
        <mat-card class="form-panel">
          <mat-card-header>
            <mat-card-title>Reasignar {{ reasignarActivoTarget.nombre }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="reasignarActivoForm" (ngSubmit)="confirmarReasignarActivo()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nuevo responsable</mat-label>
                <mat-select formControlName="nuevoResponsableId">
                  @for (r of responsablesParaReasignar; track r.id) {
                    <mat-option [value]="r.id">{{ r.nombre }} — {{ r.area }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Fecha de inicio</mat-label>
                <input matInput type="date" formControlName="fechaInicio">
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Nota</mat-label>
                <textarea matInput formControlName="notas" rows="2" placeholder="Motivo de la reasignación"></textarea>
              </mat-form-field>
              <div class="form-actions">
                <button mat-button type="button" (click)="cancelarReasignarActivo()">Cancelar</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="reasignarActivoForm.invalid">
                  Reasignar
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <!-- Panel: Reactivar (solo admin) -->
    @if (showReactivar && reactivarTarget) {
      <div class="form-overlay">
        <mat-card class="form-panel">
          <mat-card-header>
            <mat-card-title>Reactivar a {{ reactivarTarget.nombre }}</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p class="aviso-activos">
              Los activos que tenía asignados no se restauran automáticamente. Si hace falta, reasígnalos manualmente después de reactivarlo.
            </p>
            <form [formGroup]="reactivarForm" (ngSubmit)="confirmarReactivar()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Comentario</mat-label>
                <textarea matInput formControlName="comentario" rows="4"
                          placeholder="Describe el motivo de la reactivación (ej. reingreso a la empresa)"></textarea>
              </mat-form-field>
              <div class="form-actions">
                <button mat-button type="button" (click)="cancelarReactivar()">Cancelar</button>
                <button mat-raised-button color="primary" type="submit" [disabled]="reactivarForm.invalid">
                  Reactivar
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    }

    <app-responsable-info-dialog [responsable]="verDetalleTarget" (cerrar)="verDetalleTarget = null"></app-responsable-info-dialog>
  `,
  styles: [`
    .badge-activos { background:#e3f2fd; color:#1565c0; border-radius:10px; padding:2px 10px; font-weight:600; }
    .chip-activo   { background:#e8f5e9; color:#2e7d32; padding:2px 10px; border-radius:10px; font-size:12px; }
    .chip-inactivo { background:#fce4ec; color:#c62828; padding:2px 10px; border-radius:10px; font-size:12px; }
    .form-overlay  { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:999; }
    .form-panel    { width:600px; max-width:95vw; max-height:92vh; overflow-y:auto; }
    .form-panel mat-card-header { padding:16px 24px 0; }
    .form-panel mat-card-content { padding:16px 24px 20px; }
    .full-width    { width:100%; }
    .form-panel mat-form-field { margin-bottom:4px; }

    .badge-activos-btn {
      display:inline-flex; align-items:center; gap:2px;
      background:none; border:none; padding:2px 4px; border-radius:6px; cursor:pointer;
    }
    .badge-activos-btn:hover:not([disabled]) { background:rgba(63,81,181,.08); }
    .badge-activos-btn[disabled] { cursor:default; opacity:.6; }
    .badge-activos-btn mat-icon { font-size:18px; width:18px; height:18px; color:#757575; }

    .detail-row { border-bottom:1px solid rgba(0,0,0,.06); min-height:auto; }
    .detail-row-hidden { display:none; }
    .detail-cell { flex:1 1 100%; width:100%; padding:0; display:block; }
    .detail-panel { width:100%; padding:12px 24px 16px; background:#f5f7ff; box-sizing:border-box; }
    .detail-card {
      background:white; border:1px solid #e0e4f5; border-radius:10px;
      padding:14px 18px; max-width:820px;
      box-shadow:0 1px 3px rgba(26,35,126,.06);
    }
    .detail-card-header {
      display:flex; align-items:center; gap:8px;
      font-size:13px; color:#3f51b5; margin-bottom:10px;
      padding-bottom:8px; border-bottom:1px solid #eef1fd;
      mat-icon { font-size:18px; width:18px; height:18px; }
    }
    .empty-msg { margin:0; padding:6px 0; color:#757575; font-size:13px; }
    .activos-list { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; }
    .activos-list li {
      display:flex; align-items:center; gap:4px;
      border-bottom:1px solid #f4f5fb;
    }
    .activos-list li:last-child { border-bottom:none; }
    .activos-list li a {
      flex:1; display:grid; grid-template-columns:22px minmax(160px,1fr) 90px 120px; align-items:center; gap:12px;
      padding:8px 10px; border-radius:6px; text-decoration:none; color:#212121;
    }
    .activos-list li a:hover { background:#eef1fd; }
    .activos-list li a mat-icon { font-size:18px; width:18px; height:18px; color:#3f51b5; }
    .activos-list li > button mat-icon { font-size:18px; width:18px; height:18px; color:#757575; }
    .a-nombre { font-weight:500; font-size:13.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .a-codigo { color:#757575; font-size:12px; }
    .activos-list .estado-chip { justify-self:start; }

    .respaldo-icon, .obs-icon {
      font-size:16px; width:16px; height:16px; vertical-align:middle;
      margin-left:6px; color:#9e9e9e; cursor:default;
    }
    .subsection-title {
      margin:20px 0 8px; font-size:13px; font-weight:600; color:#424242;
      span { font-weight:400; color:#757575; }
    }
    .aviso-activos { font-size:13px; color:#616161; margin:4px 0 12px; }

    .aviso-permanente {
      display:flex; gap:10px; align-items:flex-start;
      background:#fff3e0; color:#7a4a00; border-radius:8px;
      padding:12px 14px; margin-bottom:16px; font-size:13px; line-height:1.5;
      mat-icon { color:#e65100; font-size:20px; width:20px; height:20px; flex:none; margin-top:1px; }
    }
    .error-msg { color:#c62828; font-size:13px; margin:4px 0 0; }
  `]
})
export class ResponsablesListComponent implements OnInit {
  responsables: Responsable[] = [];
  form!:        FormGroup;
  showForm   = false;
  editingId?: number;
  columns    = ['nombre','area','cargo','email','activos','estado','acciones'];

  verDetalleTarget: Responsable | null = null;

  expandedId: number | null = null;
  activosAsignados: ActivoList[] = [];
  loadingActivos = false;

  showDesactivar = false;
  desactivarTarget?: Responsable;
  desactivarForm!: FormGroup;
  responsablesParaReasignar: Responsable[] = [];

  showReasignarActivo = false;
  reasignarActivoTarget?: ActivoList;
  reasignarActivoForm!: FormGroup;

  showReactivar = false;
  reactivarTarget?: Responsable;
  reactivarForm!: FormGroup;

  showPasswordGate = false;
  passwordGateForm!: FormGroup;
  passwordGateAction: 'desactivar' | 'reactivar' | null = null;
  passwordGateTarget?: Responsable;
  passwordGateError: string | null = null;
  verifyingPassword = false;
  private verifiedPassword = '';

  private svc        = inject(ResponsablesService);
  private activosSvc = inject(ActivosService);
  private auth       = inject(AuthService);
  private fb         = inject(FormBuilder);
  private snack      = inject(MatSnackBar);

  get esAdmin() { return this.auth.isAdmin(); }

  ngOnInit() {
    this.initForm();
    this.cargar();
  }

  initForm() {
    this.form = this.fb.group({
      nombre:   ['', Validators.required],
      area:     ['', Validators.required],
      cargo:    [''],
      email:    ['', [Validators.required, Validators.email]],
      telefono: [''],
      contactoRespaldoNombre: [''],
      contactoRespaldoEmail:  ['', Validators.email],
    });
    this.desactivarForm = this.fb.group({
      observacion:        ['', Validators.required],
      accion:              ['sin_responsable'],
      nuevoResponsableId:  [null],
    });
    this.reasignarActivoForm = this.fb.group({
      nuevoResponsableId: [null, Validators.required],
      fechaInicio:        [new Date().toISOString().substring(0, 10), Validators.required],
      notas:               [''],
    });
    this.reactivarForm = this.fb.group({
      comentario: ['', Validators.required],
    });
    this.passwordGateForm = this.fb.group({
      password: ['', Validators.required],
    });
  }

  cargar() {
    this.svc.getAll().subscribe(r => this.responsables = r);
  }

  abrirFormulario() {
    this.editingId = undefined;
    this.form.reset();
    this.showForm = true;
  }

  editar(r: Responsable) {
    this.editingId = r.id;
    this.form.patchValue(r);
    this.showForm = true;
  }

  cancelar() { this.showForm = false; this.form.reset(); }

  verDetalle(r: Responsable) {
    this.verDetalleTarget = r;
  }

  guardar() {
    if (this.form.invalid) return;
    const obs = this.editingId
      ? this.svc.update(this.editingId, this.form.value)
      : this.svc.create(this.form.value);

    obs.subscribe({
      next:  () => { this.snack.open('Guardado correctamente', 'OK', { duration: 2500 }); this.cargar(); this.cancelar(); },
      error: () =>   this.snack.open('Error al guardar', 'OK', { duration: 2500 })
    });
  }

  abrirReactivar(r: Responsable) {
    this.abrirPasswordGate(r, 'reactivar');
  }

  abrirDesactivar(r: Responsable) {
    this.abrirPasswordGate(r, 'desactivar');
  }

  private abrirPasswordGate(r: Responsable, accion: 'desactivar' | 'reactivar') {
    this.passwordGateTarget = r;
    this.passwordGateAction = accion;
    this.passwordGateForm.reset({ password: '' });
    this.passwordGateError = null;
    this.showPasswordGate = true;
  }

  cancelarPasswordGate() {
    this.showPasswordGate = false;
    this.passwordGateTarget = undefined;
    this.passwordGateAction = null;
    this.passwordGateError = null;
  }

  confirmarPasswordGate() {
    if (this.passwordGateForm.invalid || !this.passwordGateTarget) return;
    const { password } = this.passwordGateForm.value;

    this.verifyingPassword = true;
    this.auth.verificarPassword(password).subscribe({
      next: () => {
        this.verifyingPassword  = false;
        this.verifiedPassword   = password;
        const target = this.passwordGateTarget!;
        const accion = this.passwordGateAction;
        this.cancelarPasswordGate();

        if (accion === 'desactivar') this.abrirDesactivarDialog(target);
        else if (accion === 'reactivar') this.abrirReactivarDialog(target);
      },
      error: () => {
        this.verifyingPassword  = false;
        this.passwordGateError  = 'Contraseña incorrecta';
      }
    });
  }

  private abrirReactivarDialog(r: Responsable) {
    this.reactivarTarget = r;
    this.reactivarForm.reset({ comentario: '' });
    this.showReactivar = true;
  }

  cancelarReactivar() {
    this.showReactivar = false;
    this.reactivarTarget = undefined;
  }

  confirmarReactivar() {
    if (this.reactivarForm.invalid || !this.reactivarTarget) return;
    const { comentario } = this.reactivarForm.value;

    this.svc.reactivar(this.reactivarTarget.id, { password: this.verifiedPassword, comentario }).subscribe({
      next: () => {
        this.snack.open('Responsable reactivado correctamente', 'OK', { duration: 3000 });
        this.verifiedPassword = '';
        this.cancelarReactivar();
        this.cargar();
      },
      error: (err) => {
        const msg = err?.status === 401 ? 'Contraseña incorrecta' : 'Error al reactivar el responsable';
        this.snack.open(msg, 'OK', { duration: 3000 });
      }
    });
  }

  private abrirDesactivarDialog(r: Responsable) {
    this.desactivarTarget = r;
    this.desactivarForm.reset({ observacion: '', accion: 'sin_responsable', nuevoResponsableId: null });
    this.responsablesParaReasignar = this.responsables.filter(x => x.activo && x.id !== r.id);
    this.showDesactivar = true;
  }

  cancelarDesactivar() {
    this.showDesactivar = false;
    this.desactivarTarget = undefined;
  }

  confirmarDesactivar() {
    if (this.desactivarForm.invalid || !this.desactivarTarget) return;
    const { observacion, accion, nuevoResponsableId } = this.desactivarForm.value;

    this.svc.desactivar(this.desactivarTarget.id, {
      password: this.verifiedPassword,
      observacion,
      nuevoResponsableId: accion === 'reasignar' ? nuevoResponsableId : undefined
    }).subscribe({
      next: () => {
        this.snack.open('Responsable dado de baja correctamente', 'OK', { duration: 3000 });
        this.verifiedPassword = '';
        this.cancelarDesactivar();
        this.cargar();
      },
      error: (err) => {
        const msg = err?.status === 401 ? 'Contraseña incorrecta' : 'Error al dar de baja al responsable';
        this.snack.open(msg, 'OK', { duration: 3000 });
      }
    });
  }

  toggleExpand(r: Responsable) {
    if (r.totalActivos === 0) return;

    if (this.expandedId === r.id) {
      this.expandedId = null;
      return;
    }

    this.expandedId = r.id;
    this.responsablesParaReasignar = this.responsables.filter(x => x.activo && x.id !== r.id);
    this.cargarActivosAsignados(r.id);
  }

  private cargarActivosAsignados(responsableId: number) {
    this.loadingActivos = true;
    this.activosAsignados = [];
    this.svc.getActivosAsignados(responsableId).subscribe({
      next:  a => { this.activosAsignados = a; this.loadingActivos = false; },
      error: () => { this.loadingActivos = false; }
    });
  }

  abrirReasignarActivo(a: ActivoList) {
    this.reasignarActivoTarget = a;
    this.reasignarActivoForm.reset({
      nuevoResponsableId: null,
      fechaInicio: new Date().toISOString().substring(0, 10),
      notas: ''
    });
    this.showReasignarActivo = true;
  }

  cancelarReasignarActivo() {
    this.showReasignarActivo = false;
    this.reasignarActivoTarget = undefined;
  }

  confirmarReasignarActivo() {
    if (this.reasignarActivoForm.invalid || !this.reasignarActivoTarget || this.expandedId === null) return;
    const { nuevoResponsableId, fechaInicio, notas } = this.reasignarActivoForm.value;
    const responsableOrigenId = this.expandedId;

    this.activosSvc.asignarResponsable({
      activoId:      this.reasignarActivoTarget.id,
      responsableId: nuevoResponsableId,
      fechaInicio,
      notas: notas || undefined
    }).subscribe({
      next: () => {
        this.snack.open('Activo reasignado correctamente', 'OK', { duration: 3000 });
        this.cancelarReasignarActivo();
        this.cargar();
        this.cargarActivosAsignados(responsableOrigenId);
      },
      error: () => this.snack.open('Error al reasignar el activo', 'OK', { duration: 3000 })
    });
  }
}
