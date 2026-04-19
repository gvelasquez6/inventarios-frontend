import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Empleado, EmpleadoAltaResultado } from '../../domain';
import { EmpleadoRepositoryPort } from '../../application/ports/empleado.repository.port';
import { EMPLEADO_REPOSITORY } from '../../application/ports/injection-tokens';

@Injectable()
export class EmpleadoService {
  constructor(
    @Inject(EMPLEADO_REPOSITORY) private readonly repository: EmpleadoRepositoryPort
  ) {}

  getEmpleados(): Observable<Empleado[]> {
    return this.repository.getEmpleados();
  }

  addEmpleado(
    empleado: Partial<Empleado> & { username?: string; password?: string },
  ): Observable<EmpleadoAltaResultado> {
    return this.repository.addEmpleado(empleado);
  }

  updateEmpleado(idEmpleado: number, empleado: Partial<Empleado>): Observable<Empleado> {
    return this.repository.updateEmpleado(idEmpleado, empleado);
  }
}
