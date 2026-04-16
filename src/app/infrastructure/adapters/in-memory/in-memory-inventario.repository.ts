import { Injectable } from '@angular/core';
import { Activo } from '../../../domain';

/**
 * Espejo local de activos sincronizado por {@link ApiActivoRepository}
 * para validar asignaciones en cliente antes de llamar al API.
 */
@Injectable()
export class InMemoryInventarioRepository {
  private activos: Activo[] = [];

  syncActivosMirror(list: Activo[]): void {
    this.activos = list.map((a) => ({ ...a }));
  }

  syncActivoMirror(activo: Activo): void {
    const i = this.activos.findIndex((a) => a.idActivo === activo.idActivo);
    if (i >= 0) {
      this.activos[i] = { ...activo };
    } else {
      this.activos.push({ ...activo });
    }
  }

  getActivoFromMirror(idActivo: number): Activo | undefined {
    return this.activos.find((a) => a.idActivo === idActivo);
  }
}
