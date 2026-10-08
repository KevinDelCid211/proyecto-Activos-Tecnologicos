import { Component, OnInit, inject } from '@angular/core';
import { CommonModule }               from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule }     from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }    from '@angular/material/input';
import { MatSelectModule }   from '@angular/material/select';
import { MatButtonModule }   from '@angular/material/button';
import { MatIconModule }     from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivosService }      from '../../../core/services/activos.service';
import { ReportesService }     from '../../../core/services/reportes.service';
import { ResponsablesService } from '../../../core/services/responsables.service';
import { TipoActivo, Responsable } from '../../../core/models/models';

@Component({
  selector: 'app-activo-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule,
    MatDatepickerModule, MatNativeDateModule, MatSnackBarModule
  ],
  template: `
    <div class="page-header">
      <h1>{{ isEdit ? 'Editar Activo' : 'Nuevo Activo' }}</h1>
      <button mat-button routerLink="/activos"><mat-icon>arrow_back</mat-icon> Volver</button>
    </div>

    <mat-card>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="guardar()">
          <!-- Sección 1: Identificación -->
          <h3 class="section-title"><mat-icon>info</mat-icon> Identificación</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Nombre del activo *</mat-label>
              <input matInput formControlName="nombre">
              <mat-error>Requerido</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Código</mat-label>
              <input matInput formControlName="codigo" placeholder="SRV-001">
            </mat-form-field>
          </div>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Tipo de activo *</mat-label>
              <mat-select formControlName="tipoActivoId">
                @for (t of tipos; track t.id) {
                  <mat-option [value]="t.id">
                    <mat-icon>{{ t.icono || 'device_hub' }}</mat-icon>
                    {{ t.nombre }}
                  </mat-option>
                }
              </mat-select>
              <mat-error>Requerido</mat-error>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Estado *</mat-label>
              <mat-select formControlName="estado">
                <mat-option value="Activo">Activo</mat-option>
                <mat-option value="Inactivo">Inactivo</mat-option>
                <mat-option value="Mantenimiento">Mantenimiento</mat-option>
                <mat-option value="Retirado">Retirado</mat-option>
              </mat-select>
            </mat-form-field>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Descripción</mat-label>
            <textarea matInput formControlName="descripcion" rows="3"></textarea>
          </mat-form-field>

          <!-- Sección 2: Ubicación / Red -->
          <h3 class="section-title"><mat-icon>location_on</mat-icon> Ubicación y Red</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Ubicación</mat-label>
              <input matInput formControlName="ubicacion" placeholder="DataCenter Rack A1">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Dirección IP</mat-label>
              <input matInput formControlName="direccionIP" placeholder="192.168.1.10">
            </mat-form-field>
          </div>

          <!-- Sección 3: Software / Versión -->
          <h3 class="section-title"><mat-icon>settings</mat-icon> Software y Versión</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Sistema Operativo</mat-label>
              <input matInput formControlName="sistemaOperativo" placeholder="Windows Server 2022">
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Versión</mat-label>
              <input matInput formControlName="version" placeholder="21H2">
            </mat-form-field>
          </div>

          <!-- Sección 4: Fechas y soporte -->
          <h3 class="section-title"><mat-icon>calendar_today</mat-icon> Fechas y Soporte</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Fecha de adquisición</mat-label>
              <input matInput [matDatepicker]="dp1" formControlName="fechaAdquisicion">
              <mat-datepicker-toggle matSuffix [for]="dp1"></mat-datepicker-toggle>
              <mat-datepicker #dp1></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Fecha de vencimiento / fin de soporte</mat-label>
              <input matInput [matDatepicker]="dp2" formControlName="fechaVencimiento">
              <mat-datepicker-toggle matSuffix [for]="dp2"></mat-datepicker-toggle>
              <mat-datepicker #dp2></mat-datepicker>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Avisar con anticipación de</mat-label>
              <mat-select formControlName="diasAvisoVencimiento">
                <mat-option [value]="30">30 días (estándar)</mat-option>
                <mat-option [value]="60">60 días</mat-option>
                <mat-option [value]="90">90 días</mat-option>
                <mat-option [value]="180">6 meses</mat-option>
                <mat-option [value]="365">1 año (soporte largo)</mat-option>
              </mat-select>
              <mat-hint>Para soportes largos (ej. 10 años) usa 1 año</mat-hint>
            </mat-form-field>
          </div>

          <!-- Sección 5: Costo -->
          <h3 class="section-title"><mat-icon>payments</mat-icon> Costo</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Costo del activo</mat-label>
              <input matInput type="number" min="0" step="0.01" formControlName="costo" placeholder="45000.00">
              <span matTextPrefix>{{ form.value.moneda === 'USD' ? '$ ' : 'Q ' }}</span>
            </mat-form-field>
            <mat-form-field appearance="outline">
              <mat-label>Moneda</mat-label>
              <mat-select formControlName="moneda">
                <mat-option value="GTQ">Quetzales (GTQ)</mat-option>
                <mat-option value="USD">Dólares (USD)</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <!-- Observaciones -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Observaciones</mat-label>
            <textarea matInput formControlName="observaciones" rows="3"></textarea>
          </mat-form-field>

          <!-- Sección 5: Responsable -->
          <h3 class="section-title"><mat-icon>person</mat-icon> Responsable</h3>
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Responsable asignado</mat-label>
              <mat-select formControlName="responsableId">
                <mat-option [value]="null">Sin asignar</mat-option>
                @for (r of responsablesDisponibles; track r.id) {
                  <mat-option [value]="r.id">{{ r.nombre }} — {{ r.area }}</mat-option>
                }
              </mat-select>
            </mat-form-field>
            @if (form.value.responsableId && form.value.responsableId !== responsableIdInicial) {
              <mat-form-field appearance="outline">
                <mat-label>Fecha de inicio</mat-label>
                <input matInput type="date" formControlName="fechaInicioResponsable">
              </mat-form-field>
            }
          </div>
          @if (form.value.responsableId && form.value.responsableId !== responsableIdInicial) {
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Notas de la asignación</mat-label>
              <textarea matInput formControlName="notasResponsable" rows="2"></textarea>
            </mat-form-field>
          }

          <!-- Botones -->
          <div class="form-actions">
            <button mat-button type="button" routerLink="/activos">Cancelar</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">
              <mat-icon>save</mat-icon>
              {{ saving ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Crear Activo') }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .section-title {
      display: flex; align-items: center; gap: 8px;
      color: #1a237e; border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px; margin: 20px 0 16px;
      mat-icon { font-size: 20px; }
    }
    .full-width { width: 100%; }
  `]
})
export class ActivoFormComponent implements OnInit {
  form!:    FormGroup;
  tipos:    TipoActivo[] = [];
  responsablesDisponibles: Responsable[] = [];
  responsableIdInicial: number | null = null;
  isEdit  = false;
  saving  = false;
  activoId?: number;

  private fb           = inject(FormBuilder);
  private router       = inject(Router);
  private route        = inject(ActivatedRoute);
  private activos      = inject(ActivosService);
  private reportes     = inject(ReportesService);
  private responsables = inject(ResponsablesService);
  private snack        = inject(MatSnackBar);

  ngOnInit() {
    this.form = this.fb.group({
      nombre:          ['', Validators.required],
      codigo:          [''],
      tipoActivoId:    [null, Validators.required],
      descripcion:     [''],
      estado:          ['Activo', Validators.required],
      ubicacion:       [''],
      direccionIP:     [''],
      sistemaOperativo:[''],
      version:         [''],
      fechaAdquisicion:[null],
      fechaVencimiento:[null],
      costo:           [null],
      moneda:          ['GTQ'],
      diasAvisoVencimiento: [30],
      observaciones:   [''],
      responsableId:          [null],
      fechaInicioResponsable: [new Date().toISOString().substring(0, 10)],
      notasResponsable:       [''],
    });

    this.reportes.getTiposActivo().subscribe(t => this.tipos = t);
    this.responsables.getAll(true).subscribe(r => this.responsablesDisponibles = r);

    this.activoId = this.route.snapshot.params['id'];
    if (this.activoId) {
      this.isEdit = true;
      this.activos.getById(this.activoId).subscribe(a => {
        this.form.patchValue(a);
        const actual = a.responsables?.find(r => r.esActual);
        if (actual) {
          this.responsableIdInicial = actual.responsableId;
          this.form.patchValue({ responsableId: actual.responsableId });
        }
      });
    }
  }

  guardar() {
    if (this.form.invalid) return;
    this.saving = true;
    const { responsableId, fechaInicioResponsable, notasResponsable, ...dto } = this.form.value;

    const obs = this.isEdit
      ? this.activos.update(this.activoId!, dto)
      : this.activos.create(dto);

    obs.subscribe({
      next: (res: any) => {
        const idActivo = this.isEdit ? this.activoId! : res.id;
        const responsableCambio = responsableId && responsableId !== this.responsableIdInicial;

        if (responsableCambio) {
          this.activos.asignarResponsable({
            activoId:    idActivo,
            responsableId,
            fechaInicio: fechaInicioResponsable,
            notas:       notasResponsable || undefined
          }).subscribe({
            next:  () => this.finalizarGuardado(),
            error: () => this.finalizarGuardado('Activo guardado, pero no se pudo asignar el responsable')
          });
        } else {
          this.finalizarGuardado();
        }
      },
      error: () => {
        this.snack.open('Error al guardar el activo', 'OK', { duration: 3000 });
        this.saving = false;
      }
    });
  }

  private finalizarGuardado(mensaje?: string) {
    this.snack.open(mensaje ?? `Activo ${this.isEdit ? 'actualizado' : 'creado'} correctamente`, 'OK', { duration: 3000 });
    this.router.navigate(['/activos']);
  }
}
