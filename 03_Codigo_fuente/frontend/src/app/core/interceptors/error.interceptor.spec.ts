import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

describe('errorInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['logout']);
    snackBarSpy    = jasmine.createSpyObj('MatSnackBar', ['open']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('en 401 hace logout y muestra un aviso de sesión expirada', () => {
    http.get('/api/activos').subscribe({ error: () => {} });

    httpMock.expectOne('/api/activos').flush('no autorizado', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('en 401 durante el login NO hace logout ni muestra aviso', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe({ error: () => {} });

    httpMock.expectOne(`${environment.apiUrl}/auth/login`)
      .flush('credenciales incorrectas', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('en 401 al reactivar un responsable (clave incorrecta) NO hace logout ni muestra aviso', () => {
    http.post(`${environment.apiUrl}/responsables/3/reactivar`, {}).subscribe({ error: () => {} });

    httpMock.expectOne(`${environment.apiUrl}/responsables/3/reactivar`)
      .flush('contraseña incorrecta', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('en 401 al dar de baja un responsable (clave incorrecta) NO hace logout ni muestra aviso', () => {
    http.post(`${environment.apiUrl}/responsables/3/desactivar`, {}).subscribe({ error: () => {} });

    httpMock.expectOne(`${environment.apiUrl}/responsables/3/desactivar`)
      .flush('contraseña incorrecta', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('en 401 al verificar la contraseña (popup previo) NO hace logout ni muestra aviso', () => {
    http.post(`${environment.apiUrl}/auth/verificar-password`, {}).subscribe({ error: () => {} });

    httpMock.expectOne(`${environment.apiUrl}/auth/verificar-password`)
      .flush('contraseña incorrecta', { status: 401, statusText: 'Unauthorized' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(snackBarSpy.open).not.toHaveBeenCalled();
  });

  it('en 403 muestra un aviso de permisos sin hacer logout', () => {
    http.delete('/api/activos/1').subscribe({ error: () => {} });

    httpMock.expectOne('/api/activos/1').flush('prohibido', { status: 403, statusText: 'Forbidden' });

    expect(authServiceSpy.logout).not.toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('en error de conexión (status 0) muestra un aviso', () => {
    http.get('/api/activos').subscribe({ error: () => {} });

    httpMock.expectOne('/api/activos').error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('en 500 muestra un aviso de error del servidor', () => {
    http.get('/api/activos').subscribe({ error: () => {} });

    httpMock.expectOne('/api/activos').flush('boom', { status: 500, statusText: 'Internal Server Error' });

    expect(snackBarSpy.open).toHaveBeenCalled();
  });

  it('propaga el error para que el llamador pueda manejarlo', () => {
    let propagado = false;

    http.get('/api/activos').subscribe({ error: () => { propagado = true; } });

    httpMock.expectOne('/api/activos').flush('boom', { status: 500, statusText: 'Internal Server Error' });

    expect(propagado).toBeTrue();
  });
});
