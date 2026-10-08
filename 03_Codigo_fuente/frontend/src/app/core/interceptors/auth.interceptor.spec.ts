import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { AuthService } from '../services/auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    http     = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('agrega el header Authorization cuando hay token', () => {
    authServiceSpy.getToken.and.returnValue('token-de-prueba');

    http.get('/api/activos').subscribe();

    const req = httpMock.expectOne('/api/activos');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    req.flush({});
  });

  it('no agrega el header Authorization cuando no hay token', () => {
    authServiceSpy.getToken.and.returnValue(null);

    http.get('/api/activos').subscribe();

    const req = httpMock.expectOne('/api/activos');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });
});
