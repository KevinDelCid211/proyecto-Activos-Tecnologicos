import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { LoginResponse } from '../models/models';

function buildJwt(expiresInSeconds: number): string {
  const header  = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds }));
  return `${header}.${payload}.firma-falsa`;
}

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: Router;

  const respuesta: LoginResponse = {
    token: buildJwt(3600),
    nombre: 'Admin Test',
    email: 'admin@test.gt',
    rol: 'Admin',
    expiracion: new Date(Date.now() + 3600_000).toISOString()
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service   = TestBed.inject(AuthService);
    httpMock  = TestBed.inject(HttpTestingController);
    router    = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('login() guarda el token y el usuario en localStorage', () => {
    service.login({ email: 'admin@test.gt', password: 'Admin@2024' }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    req.flush(respuesta);

    expect(localStorage.getItem('gati_token')).toBe(respuesta.token);
    expect(service.currentUser()?.email).toBe('admin@test.gt');
  });

  it('logout() limpia localStorage y redirige a /login', () => {
    service.login({ email: 'admin@test.gt', password: 'Admin@2024' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);

    service.logout();

    expect(localStorage.getItem('gati_token')).toBeNull();
    expect(service.currentUser()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('isLoggedIn() devuelve false cuando no hay token', () => {
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isLoggedIn() devuelve true con un token no expirado', () => {
    localStorage.setItem('gati_token', buildJwt(3600));
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('isLoggedIn() devuelve false con un token expirado', () => {
    localStorage.setItem('gati_token', buildJwt(-3600));
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isLoggedIn() devuelve false con un token malformado', () => {
    localStorage.setItem('gati_token', 'esto-no-es-un-jwt');
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('isAdmin() refleja el rol del usuario actual', () => {
    service.login({ email: 'admin@test.gt', password: 'Admin@2024' }).subscribe();
    httpMock.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);

    expect(service.isAdmin()).toBeTrue();
  });
});
