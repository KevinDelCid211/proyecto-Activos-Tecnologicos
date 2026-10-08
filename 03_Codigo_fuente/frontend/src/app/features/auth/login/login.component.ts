import { Component }            from '@angular/core';
import { CommonModule }         from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router }               from '@angular/router';
import { MatCardModule }        from '@angular/material/card';
import { MatFormFieldModule }   from '@angular/material/form-field';
import { MatInputModule }       from '@angular/material/input';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService }          from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  template: `
    <div class="login-bg">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>computer</mat-icon>
            Gestión de Activos TI
          </mat-card-title>
          <mat-card-subtitle>Universidad Mariano Gálvez de Guatemala</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="login()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Correo electrónico</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="email" placeholder="usuario@empresa.gt">
              <mat-error *ngIf="form.get('email')?.hasError('required')">El correo es requerido</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Contraseña</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="showPwd ? 'text' : 'password'" formControlName="password">
              <button mat-icon-button matSuffix type="button" class="pwd-toggle" (click)="showPwd = !showPwd">
                <mat-icon>{{ showPwd ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              <mat-error *ngIf="form.get('password')?.hasError('required')">La contraseña es requerida</mat-error>
            </mat-form-field>

            <p class="error-msg" *ngIf="errorMsg">{{ errorMsg }}</p>

            <button mat-raised-button color="primary" type="submit"
                    class="full-width login-btn" [disabled]="loading">
              <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
              <span *ngIf="!loading">Ingresar</span>
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%);
      display: flex; align-items: center; justify-content: center; padding: 16px;
    }
    .login-card {
      width: 100%; max-width: 420px;
      mat-card-header { text-align: center; display: block; padding: 24px 24px 0; }
      mat-card-header mat-icon { font-size: 48px; width: 48px; height: 48px; color: #1a237e; display: block; margin: 0 auto 8px; }
      mat-card-title { font-size: 22px; font-weight: 500; }
      mat-card-subtitle { margin-top: 4px; }
    }
    mat-card-content { padding: 16px 24px 24px; }
    .full-width { width: 100%; }
    [matPrefix] { font-size: 20px; width: 20px; height: 20px; margin-right: 4px; color: #757575; }
    .pwd-toggle {
      width: 34px; height: 34px; padding: 7px;
      margin-right: 6px;
      --mdc-icon-button-state-layer-size: 34px;
      mat-icon { font-size: 20px; width: 20px; height: 20px; }
    }
    .login-btn  { height: 48px; font-size: 16px; margin-top: 8px; }
    .error-msg  { color: #c62828; font-size: 13px; margin: 0 0 8px; text-align: center; }
  `]
})
export class LoginComponent {
  form:     FormGroup;
  loading  = false;
  showPwd  = false;
  errorMsg = '';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email:    ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    if (this.auth.isLoggedIn()) this.router.navigate(['/']);
  }

  login() {
    if (this.form.invalid) return;
    this.loading  = true;
    this.errorMsg = '';

    this.auth.login(this.form.value).subscribe({
      next:  () => this.router.navigate(['/']),
      error: () => { this.errorMsg = 'Correo o contraseña incorrectos'; this.loading = false; }
    });
  }
}
