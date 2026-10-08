import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule }    from '@angular/common';
import { MatCardModule }   from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule }   from '@angular/material/icon';
import { Responsable }     from '../../../core/models/models';

@Component({
  selector: 'app-responsable-info-dialog',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    @if (responsable) {
      <div class="form-overlay" (click)="cerrar.emit()">
        <mat-card class="info-panel" (click)="$event.stopPropagation()">
          <mat-card-header>
            <mat-card-title>{{ responsable.nombre }}</mat-card-title>
            <mat-card-subtitle>
              <span [class]="responsable.activo ? 'chip-activo' : 'chip-inactivo'">
                {{ responsable.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Área</span>
                <span>{{ responsable.area }}</span>
              </div>
              <div class="info-item">
                <span class="label">Cargo</span>
                <span>{{ responsable.cargo || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Correo</span>
                <span>{{ responsable.email }}</span>
              </div>
              <div class="info-item">
                <span class="label">Teléfono</span>
                <span>{{ responsable.telefono || '—' }}</span>
              </div>
              <div class="info-item">
                <span class="label">Activos asignados</span>
                <span>{{ responsable.totalActivos }}</span>
              </div>
            </div>

            @if (responsable.contactoRespaldoNombre) {
              <div class="respaldo-box">
                <mat-icon>swap_horiz</mat-icon>
                <div>
                  <strong>Contacto de respaldo</strong>
                  <p>{{ responsable.contactoRespaldoNombre }}{{ responsable.contactoRespaldoEmail ? ' — ' + responsable.contactoRespaldoEmail : '' }}</p>
                </div>
              </div>
            }

            @if (responsable.observaciones) {
              <div class="obs-box">
                <strong>Observaciones</strong>
                <p>{{ responsable.observaciones }}</p>
              </div>
            }

            <div class="form-actions">
              <button mat-button type="button" (click)="cerrar.emit()">Cerrar</button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .form-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:999; }
    .info-panel { width:460px; max-width:95vw; }
    .chip-activo   { background:#e8f5e9; color:#2e7d32; padding:2px 10px; border-radius:10px; font-size:12px; }
    .chip-inactivo { background:#fce4ec; color:#c62828; padding:2px 10px; border-radius:10px; font-size:12px; }
    .info-grid {
      display:grid; grid-template-columns:repeat(2, 1fr); gap:14px;
      margin-top:8px;
    }
    .info-item { display:flex; flex-direction:column; }
    .info-item .label { font-size:11px; color:#757575; text-transform:uppercase; font-weight:500; }
    .info-item span:last-child { font-size:14px; margin-top:2px; }
    .respaldo-box, .obs-box {
      display:flex; gap:10px; align-items:flex-start;
      background:#f5f5f5; border-radius:8px; padding:10px 12px; margin-top:16px;
      p { margin:2px 0 0; font-size:13px; color:#424242; }
      strong { font-size:12.5px; }
    }
    .respaldo-box mat-icon { color:#3f51b5; font-size:20px; width:20px; height:20px; margin-top:1px; }
    .form-actions { display:flex; justify-content:flex-end; margin-top:20px; }
  `]
})
export class ResponsableInfoDialogComponent {
  @Input() responsable: Responsable | null = null;
  @Output() cerrar = new EventEmitter<void>();
}
