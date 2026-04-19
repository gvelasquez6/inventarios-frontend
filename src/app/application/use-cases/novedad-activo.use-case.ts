import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NovedadActivo } from '../../domain';
import { NOVEDAD_ACTIVO_REPOSITORY } from '../ports/injection-tokens';
import { NovedadActivoRepositoryPort } from '../ports/novedad-activo.repository.port';

@Injectable({ providedIn: 'root' })
export class NovedadActivoUseCase {
  constructor(
    @Inject(NOVEDAD_ACTIVO_REPOSITORY) private readonly repository: NovedadActivoRepositoryPort,
  ) {}

  getNovedades(): Observable<NovedadActivo[]> {
    return this.repository.getNovedades();
  }

  getMisNovedades(idEmpleado: number): Observable<NovedadActivo[]> {
    return this.repository.getMisNovedades(idEmpleado);
  }

  reportar(input: {
    idActivo: number;
    idEmpleado: number;
    idAsignacion?: number | null;
    tipo: string;
    descripcion: string;
  }): Observable<NovedadActivo> {
    return this.repository.crear(input);
  }

  actualizarEstado(
    idNovedad: number,
    input: { estado: string; comentarioAdmin?: string },
  ): Observable<NovedadActivo> {
    return this.repository.actualizarEstado(idNovedad, input);
  }
}
