import { Observable } from 'rxjs';
import { Activo } from '../../domain';

export abstract class ActivoRepositoryPort {
  abstract getActivos(): Observable<Activo[]>;
  abstract addActivo(activo: Partial<Activo>): Observable<Activo>;
  abstract updateActivo(idActivo: number, patch: Partial<Activo>): Observable<Activo>;
}
