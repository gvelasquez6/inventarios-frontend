import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SolicitudAsignacion } from '../../domain';
import { SolicitudAsignacionRepositoryPort } from '../ports/solicitud-asignacion.repository.port';
import { SOLICITUD_ASIGNACION_REPOSITORY } from '../ports/injection-tokens';

/**
 * Caso de uso para solicitudes de asignación.
 * Mantiene la misma lógica actual pero evita que los componentes
 * dependan directamente de servicios de infraestructura/core.
 */
@Injectable({ providedIn: 'root' })
export class SolicitudAsignacionUseCase {
  constructor(
    @Inject(SOLICITUD_ASIGNACION_REPOSITORY)
    private readonly repository: SolicitudAsignacionRepositoryPort,
  ) {}

  getSolicitudes(idEmpleado?: number): Observable<SolicitudAsignacion[]> {
    return this.repository.getSolicitudes(idEmpleado);
  }

  addSolicitud(input: {
    idActivo: number;
    idEmpleado: number;
    motivo?: string;
  }): Observable<SolicitudAsignacion> {
    return this.repository.addSolicitud(input);
  }

  updateSolicitud(
    idSolicitud: number,
    input: { idActivo: number; idEmpleado: number; motivo?: string },
  ): Observable<SolicitudAsignacion> {
    return this.repository.updateSolicitud(idSolicitud, input);
  }

  deleteSolicitud(idSolicitud: number, idEmpleado: number): Observable<void> {
    return this.repository.deleteSolicitud(idSolicitud, idEmpleado);
  }

  aprobarSolicitud(idSolicitud: number, comentarioAdmin?: string): Observable<SolicitudAsignacion> {
    return this.repository.aprobarSolicitud(idSolicitud, comentarioAdmin);
  }

  rechazarSolicitud(idSolicitud: number, comentarioAdmin?: string): Observable<SolicitudAsignacion> {
    return this.repository.rechazarSolicitud(idSolicitud, comentarioAdmin);
  }
}
