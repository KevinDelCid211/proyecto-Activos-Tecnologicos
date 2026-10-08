import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth      = inject(AuthService);
  const snackBar  = inject(MatSnackBar);
  // Estas llamadas devuelven 401 como resultado de negocio (credenciales/clave incorrectas),
  // no porque haya expirado la sesión — no deben forzar un logout automático.
  const esVerificacionDeCredenciales =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/verificar-password') ||
    req.url.endsWith('/reactivar') ||
    req.url.endsWith('/desactivar');

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!esVerificacionDeCredenciales) {
        if (error.status === 401) {
          auth.logout();
          snackBar.open('Tu sesión expiró. Inicia sesión de nuevo.', 'Cerrar', { duration: 5000 });
        } else if (error.status === 403) {
          snackBar.open('No tienes permisos para realizar esta acción.', 'Cerrar', { duration: 5000 });
        } else if (error.status === 0) {
          snackBar.open('No se pudo conectar con el servidor.', 'Cerrar', { duration: 5000 });
        } else if (error.status >= 500) {
          snackBar.open('Ocurrió un error en el servidor. Intenta de nuevo.', 'Cerrar', { duration: 5000 });
        } else if (error.error?.message) {
          snackBar.open(error.error.message, 'Cerrar', { duration: 5000 });
        }
      }
      return throwError(() => error);
    })
  );
};
