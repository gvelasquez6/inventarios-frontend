import { Observable } from 'rxjs';
import { NovedadActivo } from '../../domain';

export abstract class NovedadActivoRepositoryPort {
  abstract getNovedades(): Observable<NovedadActivo[]>;
  abstract getMisNovedades(idEmpleado: number): Observable<NovedadActivo[]>;
  abstract crear(input: {
    idActivo: number;
    idEmpleado: number;
    idAsignacion?: number | null;
    tipo: string;
    descripcion: string;
  }): Observable<NovedadActivo>;
  abstract actualizarEstado(
    idNovedad: number,
    input: { estado: string; comentarioAdmin?: string },
  ): Observable<NovedadActivo>;
}
