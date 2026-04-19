import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NovedadActivo } from '../../../domain';
import { NovedadActivoRepositoryPort } from '../../../application/ports/novedad-activo.repository.port';
import { environment } from '../../../../environments/environment';
import { mensajeErrorHttp } from '../../http/http-error.util';

function normalizarNovedad(raw: NovedadActivo): NovedadActivo {
  const fr = raw.fechaReporte;
  const fechaReporte =
    fr instanceof Date ? fr : new Date(fr as unknown as string);
  const fresp = raw.fechaRespuesta;
  const fechaRespuesta =
    fresp == null
      ? undefined
      : fresp instanceof Date
        ? fresp
        : new Date(fresp as unknown as string);
  return {
    ...raw,
    fechaReporte,
    fechaRespuesta,
  };
}

@Injectable()
export class ApiNovedadActivoRepository implements NovedadActivoRepositoryPort {
  private readonly url = `${environment.apiBaseUrl}/api/novedades-activo`;

  constructor(private readonly http: HttpClient) {}

  getNovedades(): Observable<NovedadActivo[]> {
    return this.http.get<NovedadActivo[]>(this.url).pipe(
      map((list) => list.map((n) => normalizarNovedad(n))),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'No se pudieron cargar las novedades.'))),
      ),
    );
  }

  getMisNovedades(idEmpleado: number): Observable<NovedadActivo[]> {
    const params = new HttpParams().set('idEmpleado', String(idEmpleado));
    return this.http.get<NovedadActivo[]>(`${this.url}/mias`, { params }).pipe(
      map((list) => list.map((n) => normalizarNovedad(n))),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'No se pudieron cargar tus reportes.'))),
      ),
    );
  }

  crear(input: {
    idActivo: number;
    idEmpleado: number;
    idAsignacion?: number | null;
    tipo: string;
    descripcion: string;
  }): Observable<NovedadActivo> {
    const body = {
      idActivo: input.idActivo,
      idEmpleado: input.idEmpleado,
      idAsignacion: input.idAsignacion ?? undefined,
      tipo: input.tipo,
      descripcion: input.descripcion,
    };
    return this.http.post<NovedadActivo>(this.url, body).pipe(
      map((raw) => normalizarNovedad(raw)),
      catchError((err: HttpErrorResponse) =>
        throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo enviar el reporte.'))),
      ),
    );
  }

  actualizarEstado(
    idNovedad: number,
    input: { estado: string; comentarioAdmin?: string },
  ): Observable<NovedadActivo> {
    return this.http
      .put<NovedadActivo>(`${this.url}/${idNovedad}/estado`, {
        estado: input.estado,
        comentarioAdmin: input.comentarioAdmin ?? null,
      })
      .pipe(
        map((raw) => normalizarNovedad(raw)),
        catchError((err: HttpErrorResponse) =>
          throwError(() => new Error(mensajeErrorHttp(err, 'No se pudo actualizar el estado.'))),
        ),
      );
  }
}
