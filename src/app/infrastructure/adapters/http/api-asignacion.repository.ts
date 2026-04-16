import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Activo, Asignacion, EstadoActivo } from '../../../domain';
import { AsignacionRepositoryPort } from '../../../application/ports/asignacion.repository.port';
import { InMemoryInventarioRepository } from '../in-memory/in-memory-inventario.repository';
import { environment } from '../../../../environments/environment';
import { mensajeErrorHttp } from '../../http/http-error.util';

function normalizeAsignacion(raw: Asignacion): Asignacion {
  const fechaAsignacion =
    raw.fechaAsignacion instanceof Date
      ? raw.fechaAsignacion
      : new Date(raw.fechaAsignacion as unknown as string);
  const fd = raw.fechaDevolucion;
  const fechaDevolucion =
    fd == null
      ? undefined
      : fd instanceof Date
        ? fd
        : new Date(fd as unknown as string);
  return {
    ...raw,
    fechaAsignacion,
    fechaDevolucion,
  };
}

@Injectable()
export class ApiAsignacionRepository implements AsignacionRepositoryPort {
  private readonly url = `${environment.apiBaseUrl}/api/asignaciones`;

  constructor(
    private readonly http: HttpClient,
    private readonly inventarioMem: InMemoryInventarioRepository,
  ) {}

  getAsignaciones(): Observable<Asignacion[]> {
    return this.http.get<Asignacion[]>(this.url).pipe(
      map((list) => list.map((a) => normalizeAsignacion(a))),
    );
  }

  addAsignacion(asignacion: Partial<Asignacion>): Observable<Asignacion> {
    const idActivo = asignacion.activo?.idActivo;
    const idEmpleado = asignacion.empleado?.idEmpleado;
    if (idActivo == null || idEmpleado == null) {
      return throwError(() => new Error('Activo y empleado son obligatorios.'));
    }

    const activo = this.inventarioMem.getActivoFromMirror(idActivo);
    if (!activo) {
      return throwError(() => new Error('El activo no existe'));
    }
    if (activo.estado !== EstadoActivo.DISPONIBLE) {
      return throwError(() => new Error('El activo ya está asignado o no está disponible'));
    }

    const fecha = asignacion.fechaAsignacion;
    const fechaIso =
      fecha instanceof Date ? fecha.toISOString() : (fecha as string | undefined) ?? undefined;

    const body = {
      activo: { idActivo },
      empleado: { idEmpleado },
      fechaAsignacion: fechaIso,
    };

    return this.http.post<Asignacion>(this.url, body).pipe(
      map((raw) => normalizeAsignacion(raw)),
      tap((saved) => {
        if (saved.activo) {
          this.inventarioMem.syncActivoMirror(saved.activo as Activo);
        }
      }),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'Error al asignar'))),
      ),
    );
  }

  updateAsignacion(idAsignacion: number, asignacion: Partial<Asignacion>): Observable<Asignacion> {
    const idActivo = asignacion.activo?.idActivo;
    const idEmpleado = asignacion.empleado?.idEmpleado;
    if (idActivo == null || idEmpleado == null) {
      return throwError(() => new Error('Activo y empleado son obligatorios.'));
    }

    const fecha = asignacion.fechaAsignacion;
    const fechaIso =
      fecha instanceof Date ? fecha.toISOString() : (fecha as string | undefined) ?? undefined;

    const body = {
      activo: { idActivo },
      empleado: { idEmpleado },
      fechaAsignacion: fechaIso,
    };

    return this.http.put<Asignacion>(`${this.url}/${idAsignacion}`, body).pipe(
      map((raw) => normalizeAsignacion(raw)),
      tap((saved) => {
        if (saved.activo) {
          this.inventarioMem.syncActivoMirror(saved.activo as Activo);
        }
      }),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'Error al actualizar la asignación'))),
      ),
    );
  }

  deleteAsignacion(idAsignacion: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${idAsignacion}`).pipe(
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'Error al eliminar la asignación'))),
      ),
    );
  }
}
