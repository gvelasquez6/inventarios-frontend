import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Activo } from '../../domain';
import { ActivoRepositoryPort } from '../../application/ports/activo.repository.port';
import { ACTIVO_REPOSITORY } from '../../application/ports/injection-tokens';

@Injectable()
export class ActivoService {
  constructor(
    @Inject(ACTIVO_REPOSITORY) private readonly repository: ActivoRepositoryPort
  ) {}

  getActivos(): Observable<Activo[]> {
    return this.repository.getActivos();
  }

  addActivo(activo: Partial<Activo>): Observable<Activo> {
    return this.repository.addActivo(activo);
  }

  updateActivo(idActivo: number, patch: Partial<Activo>): Observable<Activo> {
    return this.repository.updateActivo(idActivo, patch);
  }
}
