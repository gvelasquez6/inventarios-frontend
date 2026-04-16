import { Observable } from 'rxjs';
import { Empleado } from '../../domain';

export abstract class EmpleadoRepositoryPort {
  abstract getEmpleados(): Observable<Empleado[]>;
  abstract addEmpleado(empleado: Partial<Empleado>): Observable<Empleado>;
  abstract updateEmpleado(idEmpleado: number, empleado: Partial<Empleado>): Observable<Empleado>;
}
