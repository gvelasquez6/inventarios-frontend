import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';
import { Activo, EstadoActivo } from '../../../domain';
import { ActivoRepositoryPort } from '../../../application/ports/activo.repository.port';
import { InMemoryInventarioRepository } from '../in-memory/in-memory-inventario.repository';
import { environment } from '../../../../environments/environment';

/** Asegura `idActivo` aunque el JSON use `id_activo`. */
function normalizarActivo(raw: Activo & { id_activo?: number }): Activo {
  const id = raw.idActivo ?? raw.id_activo;
  const n = id == null ? NaN : Number(id);
  return {
    ...raw,
    idActivo: Number.isFinite(n) ? n : Number(raw.idActivo ?? 0),
  };
}

/**
 * Persistencia de activos vía API REST; mantiene un espejo en memoria para asignaciones locales.
 */
@Injectable()
export class ApiActivoRepository implements ActivoRepositoryPort {
  private readonly url = `${environment.apiBaseUrl}/api/activos`;

  constructor(
    private readonly http: HttpClient,
    private readonly inventarioMem: InMemoryInventarioRepository,
  ) {}

  getActivos(): Observable<Activo[]> {
    return this.http.get<(Activo & { id_activo?: number })[]>(this.url).pipe(
      map((list) => list.map((row) => normalizarActivo(row))),
      tap((list) => this.inventarioMem.syncActivosMirror(list)),
    );
  }

  addActivo(activo: Partial<Activo>): Observable<Activo> {
    const estado = activo.estado ?? EstadoActivo.DISPONIBLE;
    const body = {
      tipo: activo.tipo ?? '',
      marca: activo.marca ?? '',
      modelo: activo.modelo ?? '',
      serial: activo.serial ?? '',
      estado,
    };
    return this.http.post<Activo & { id_activo?: number }>(this.url, body).pipe(
      map((saved) => normalizarActivo(saved)),
      tap((saved) => this.inventarioMem.syncActivoMirror(saved)),
    );
  }

  updateActivo(idActivo: number, patch: Partial<Activo>): Observable<Activo> {
    const fromMirror = this.inventarioMem.getActivoFromMirror(idActivo);
    if (fromMirror) {
      const merged = { ...fromMirror, ...patch, idActivo };
      return this.http.put<Activo & { id_activo?: number }>(`${this.url}/${idActivo}`, merged).pipe(
        map((saved) => normalizarActivo(saved)),
        tap((saved) => this.inventarioMem.syncActivoMirror(saved)),
      );
    }
    return this.getActivos().pipe(
      take(1),
      switchMap((list) => {
        const current = list.find((a) => a.idActivo === idActivo);
        if (!current) {
          return throwError(
            () => new Error(`No se encontró el activo ${idActivo} para actualizar.`),
          );
        }
        const merged = { ...current, ...patch, idActivo };
        return this.http.put<Activo & { id_activo?: number }>(`${this.url}/${idActivo}`, merged).pipe(
          map((saved) => normalizarActivo(saved)),
          tap((saved) => this.inventarioMem.syncActivoMirror(saved)),
        );
      }),
    );
  }
}
