import { Observable } from 'rxjs';
import { Asignacion } from '../../domain';

export abstract class AsignacionRepositoryPort {
  abstract getAsignaciones(): Observable<Asignacion[]>;
  abstract addAsignacion(asignacion: Partial<Asignacion>): Observable<Asignacion>;
  abstract updateAsignacion(
    idAsignacion: number,
    asignacion: Partial<Asignacion>,
  ): Observable<Asignacion>;
  abstract deleteAsignacion(idAsignacion: number): Observable<void>;
}
