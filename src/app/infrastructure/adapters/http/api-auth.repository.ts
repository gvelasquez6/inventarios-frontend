import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthRepositoryPort } from '../../../application/ports/auth.repository.port';
import { LoginResultDto } from '../../../domain';
import { environment } from '../../../../environments/environment';
import { mensajeErrorHttp } from '../../http/http-error.util';

@Injectable()
export class ApiAuthRepository implements AuthRepositoryPort {
  private readonly url = `${environment.apiBaseUrl}/api/auth`;

  constructor(private readonly http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<LoginResultDto> {
    // Sin envolver en Error: el caso de uso debe distinguir 401 (credenciales) de 404/red, etc.
    return this.http.post<LoginResultDto>(`${this.url}/login`, credentials);
  }

  me(): Observable<LoginResultDto> {
    return this.http.get<LoginResultDto>(`${this.url}/me`).pipe(
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo validar la sesión.'))),
      ),
    );
  }

  cambiarPassword(body: { passwordActual: string; passwordNueva: string }): Observable<void> {
    return this.http
      .post<{ mensaje: string }>(`${this.url}/cambiar-contrasena`, body)
      .pipe(
        map(() => undefined),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo cambiar la contraseña.'))),
        ),
      );
  }
}
