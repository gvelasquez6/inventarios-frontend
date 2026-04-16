import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Asignacion } from '../../domain';
import { AsignacionRepositoryPort } from '../../application/ports/asignacion.repository.port';
import { ASIGNACION_REPOSITORY } from '../../application/ports/injection-tokens';

@Injectable()
export class AsignacionService {
  constructor(
    @Inject(ASIGNACION_REPOSITORY) private readonly repository: AsignacionRepositoryPort
  ) {}

  getAsignaciones(): Observable<Asignacion[]> {
    return this.repository.getAsignaciones();
  }

  addAsignacion(asignacion: Partial<Asignacion>): Observable<Asignacion> {
    return this.repository.addAsignacion(asignacion);
  }

  updateAsignacion(idAsignacion: number, asignacion: Partial<Asignacion>): Observable<Asignacion> {
    return this.repository.updateAsignacion(idAsignacion, asignacion);
  }

  deleteAsignacion(idAsignacion: number): Observable<void> {
    return this.repository.deleteAsignacion(idAsignacion);
  }
}
