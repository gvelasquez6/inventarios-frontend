import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { SolicitudAsignacion } from '../../../domain';
import { SolicitudAsignacionRepositoryPort } from '../../../application/ports/solicitud-asignacion.repository.port';
import { mensajeErrorHttp } from '../../http/http-error.util';

type SolicitudRaw = Omit<SolicitudAsignacion, 'fechaSolicitud' | 'fechaRespuesta'> & {
  fechaSolicitud: string | Date;
  fechaRespuesta?: string | Date | null;
  estado_solicitud?: string;
};

function normalizarSolicitud(raw: SolicitudRaw): SolicitudAsignacion {
  const fechaSolicitud =
    raw.fechaSolicitud instanceof Date
      ? raw.fechaSolicitud
      : new Date(raw.fechaSolicitud as unknown as string);
  const fechaRespuesta =
    raw.fechaRespuesta == null
      ? undefined
      : raw.fechaRespuesta instanceof Date
        ? raw.fechaRespuesta
        : new Date(raw.fechaRespuesta as unknown as string);
  const estadoSolicitud = raw.estadoSolicitud ?? raw.estado_solicitud ?? '';
  return {
    ...raw,
    estadoSolicitud,
    fechaSolicitud,
    fechaRespuesta,
  };
}

@Injectable()
export class ApiSolicitudAsignacionRepository implements SolicitudAsignacionRepositoryPort {
  private readonly url = `${environment.apiBaseUrl}/api/solicitudes-asignacion`;

  constructor(private readonly http: HttpClient) {}

  getSolicitudes(idEmpleado?: number): Observable<SolicitudAsignacion[]> {
    let params = new HttpParams();
    if (idEmpleado != null) {
      params = params.set('idEmpleado', String(idEmpleado));
    }
    return this.http.get<SolicitudRaw[]>(this.url, { params }).pipe(
      map((list) => list.map((row) => normalizarSolicitud(row))),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo cargar las solicitudes.'))),
      ),
    );
  }

  addSolicitud(input: {
    idActivo: number;
    idEmpleado: number;
    motivo?: string;
  }): Observable<SolicitudAsignacion> {
    return this.http.post<SolicitudRaw>(this.url, input).pipe(
      map((row) => normalizarSolicitud(row)),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo crear la solicitud.'))),
      ),
    );
  }

  updateSolicitud(
    idSolicitud: number,
    input: { idActivo: number; idEmpleado: number; motivo?: string },
  ): Observable<SolicitudAsignacion> {
    return this.http.put<SolicitudRaw>(`${this.url}/${idSolicitud}`, input).pipe(
      map((row) => normalizarSolicitud(row)),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo actualizar la solicitud.'))),
      ),
    );
  }

  deleteSolicitud(idSolicitud: number, idEmpleado: number): Observable<void> {
    const params = new HttpParams().set('idEmpleado', String(idEmpleado));
    return this.http
      .post(`${this.url}/${idSolicitud}/eliminar`, null, { params, responseType: 'text' })
      .pipe(
        map(() => undefined),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo eliminar la solicitud.'))),
        ),
      );
  }

  aprobarSolicitud(idSolicitud: number, comentarioAdmin?: string): Observable<SolicitudAsignacion> {
    return this.http
      .put<SolicitudRaw>(`${this.url}/${idSolicitud}/aprobar`, { comentarioAdmin: comentarioAdmin || null })
      .pipe(
        map((row) => normalizarSolicitud(row)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo aprobar la solicitud.'))),
        ),
      );
  }

  rechazarSolicitud(idSolicitud: number, comentarioAdmin?: string): Observable<SolicitudAsignacion> {
    return this.http
      .put<SolicitudRaw>(`${this.url}/${idSolicitud}/rechazar`, { comentarioAdmin: comentarioAdmin || null })
      .pipe(
        map((row) => normalizarSolicitud(row)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo rechazar la solicitud.'))),
        ),
      );
  }
}
