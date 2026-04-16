import { Observable } from 'rxjs';
import { SolicitudAsignacion } from '../../domain';

export abstract class SolicitudAsignacionRepositoryPort {
  abstract getSolicitudes(idEmpleado?: number): Observable<SolicitudAsignacion[]>;
  abstract addSolicitud(input: {
    idActivo: number;
    idEmpleado: number;
    motivo?: string;
  }): Observable<SolicitudAsignacion>;
  abstract updateSolicitud(
    idSolicitud: number,
    input: { idActivo: number; idEmpleado: number; motivo?: string },
  ): Observable<SolicitudAsignacion>;
  abstract deleteSolicitud(idSolicitud: number, idEmpleado: number): Observable<void>;
  abstract aprobarSolicitud(idSolicitud: number, comentarioAdmin?: string): Observable<SolicitudAsignacion>;
  abstract rechazarSolicitud(idSolicitud: number, comentarioAdmin?: string): Observable<SolicitudAsignacion>;
}
