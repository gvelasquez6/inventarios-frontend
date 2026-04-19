import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Empleado, EmpleadoAltaResultado } from '../../../domain';
import { EmpleadoRepositoryPort } from '../../../application/ports/empleado.repository.port';
import { environment } from '../../../../environments/environment';
import { mensajeErrorHttp } from '../../http/http-error.util';

/** Asegura `idEmpleado` aunque el JSON use `id_empleado` u otros alias. */
function normalizarEmpleado(raw: unknown): Empleado {
  const r = raw as Record<string, unknown>;
  const id = r['idEmpleado'] ?? r['id_empleado'];
  const n = id == null ? NaN : Number(id);
  const idEmpleado = Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
  const base = raw as Partial<Empleado>;
  return {
    ...base,
    idEmpleado,
    nombre: String(base.nombre ?? ''),
    cargo: String(base.cargo ?? ''),
    area: String(base.area ?? ''),
    activo: base.activo ?? true,
  };
}

function normalizarAltaRespuesta(raw: unknown): EmpleadoAltaResultado {
  const r = raw as Record<string, unknown>;
  return {
    empleado: normalizarEmpleado(r['empleado']),
    credencialUsuario: (r['credencialUsuario'] as string | undefined) ?? undefined,
    credencialPassword: (r['credencialPassword'] as string | undefined) ?? undefined,
    credencialGenerada: Boolean(r['credencialGenerada']),
  };
}

@Injectable()
export class ApiEmpleadoRepository implements EmpleadoRepositoryPort {
  private readonly url = `${environment.apiBaseUrl}/api/empleados`;

  constructor(private readonly http: HttpClient) {}

  getEmpleados(): Observable<Empleado[]> {
    return this.http
      .get<(Empleado & { id_empleado?: number })[]>(this.url)
      .pipe(map((list) => list.map((row) => normalizarEmpleado(row as unknown))));
  }

  addEmpleado(
    empleado: Partial<Empleado> & { username?: string; password?: string },
  ): Observable<EmpleadoAltaResultado> {
    const body: Record<string, unknown> = {
      nombre: empleado.nombre ?? '',
      cargo: empleado.cargo ?? '',
      area: empleado.area ?? '',
      activo: empleado.activo ?? true,
    };
    const u = empleado.username?.trim();
    const p = empleado.password?.trim();
    if (u) {
      body['username'] = u;
    }
    if (p) {
      body['password'] = p;
    }
    return this.http.post<unknown>(this.url, body).pipe(
      map((row) => normalizarAltaRespuesta(row)),
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
        map((row) => normalizarEmpleado(row as unknown)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo actualizar el empleado.'))),
        ),
      );
  }
}
