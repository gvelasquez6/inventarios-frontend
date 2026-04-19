import { Observable } from 'rxjs';
import { Empleado, EmpleadoAltaResultado } from '../../domain';

export abstract class EmpleadoRepositoryPort {
  abstract getEmpleados(): Observable<Empleado[]>;
  abstract addEmpleado(
    empleado: Partial<Empleado> & { username?: string; password?: string },
  ): Observable<EmpleadoAltaResultado>;
  abstract updateEmpleado(idEmpleado: number, empleado: Partial<Empleado>): Observable<Empleado>;
}
