import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Empleado } from '../../../domain';
import { EmpleadoRepositoryPort } from '../../../application/ports/empleado.repository.port';
import { environment } from '../../../../environments/environment';
import { mensajeErrorHttp } from '../../http/http-error.util';

/** Asegura `idEmpleado` aunque el JSON use `id_empleado` (p. ej. otra convención). */
function normalizarEmpleado(raw: Empleado & { id_empleado?: number }): Empleado {
  const id = raw.idEmpleado ?? raw.id_empleado;
  const n = id == null ? NaN : Number(id);
  return {
    ...raw,
    idEmpleado: Number.isFinite(n) ? n : Number(raw.idEmpleado ?? 0),
    activo: raw.activo ?? true,
  };
}

@Injectable()
export class ApiEmpleadoRepository implements EmpleadoRepositoryPort {
  private readonly url = `${environment.apiBaseUrl}/api/empleados`;

  constructor(private readonly http: HttpClient) {}

  getEmpleados(): Observable<Empleado[]> {
    return this.http
      .get<(Empleado & { id_empleado?: number })[]>(this.url)
      .pipe(map((list) => list.map((row) => normalizarEmpleado(row))));
  }

  addEmpleado(empleado: Partial<Empleado>): Observable<Empleado> {
    const body = {
      nombre: empleado.nombre ?? '',
      cargo: empleado.cargo ?? '',
      area: empleado.area ?? '',
      activo: empleado.activo ?? true,
    };
    return this.http
      .post<Empleado & { id_empleado?: number }>(this.url, body)
      .pipe(
        map((row) => normalizarEmpleado(row)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo crear el empleado.'))),
        ),
      );
  }

  updateEmpleado(idEmpleado: number, empleado: Partial<Empleado>): Observable<Empleado> {
    const body = {
      nombre: empleado.nombre ?? '',
      cargo: empleado.cargo ?? '',
      area: empleado.area ?? '',
      activo: empleado.activo,
    };
    return this.http
      .put<Empleado & { id_empleado?: number }>(`${this.url}/${idEmpleado}`, body)
      .pipe(
        map((row) => normalizarEmpleado(row)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo actualizar el empleado.'))),
        ),
      );
  }
}
