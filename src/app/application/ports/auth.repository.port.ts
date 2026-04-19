import { Observable } from 'rxjs';
import type { LoginResultDto } from '../../domain';

export abstract class AuthRepositoryPort {
  abstract login(credentials: { username: string; password: string }): Observable<LoginResultDto>;

  abstract me(): Observable<LoginResultDto>;

  abstract cambiarPassword(body: {
    passwordActual: string;
    passwordNueva: string;
  }): Observable<void>;
}
