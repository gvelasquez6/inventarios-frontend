import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Activo, Empleado, Asignacion } from '../../domain';
import { ActivoRepositoryPort } from '../ports/activo.repository.port';
import { EmpleadoRepositoryPort } from '../ports/empleado.repository.port';
import { AsignacionRepositoryPort } from '../ports/asignacion.repository.port';
import { ACTIVO_REPOSITORY, ASIGNACION_REPOSITORY, EMPLEADO_REPOSITORY } from '../ports/injection-tokens';

/**
 * Caso de uso / servicio de aplicación: fachada sobre activos, empleados y asignaciones.
 */
@Injectable()
export class InventarioService {
  constructor(
    @Inject(ACTIVO_REPOSITORY) private readonly activos: ActivoRepositoryPort,
    @Inject(EMPLEADO_REPOSITORY) private readonly empleados: EmpleadoRepositoryPort,
    @Inject(ASIGNACION_REPOSITORY) private readonly asignaciones: AsignacionRepositoryPort,
  ) {}

  getActivos(): Observable<Activo[]> {
    return this.activos.getActivos();
  }

  addActivo(activo: Partial<Activo>): Observable<Activo> {
    return this.activos.addActivo(activo);
  }

  updateActivo(idActivo: number, patch: Partial<Activo>): Observable<Activo> {
    return this.activos.updateActivo(idActivo, patch);
  }

  getEmpleados(): Observable<Empleado[]> {
    return this.empleados.getEmpleados();
  }

  addEmpleado(empleado: Partial<Empleado>): Observable<Empleado> {
    return this.empleados.addEmpleado(empleado);
  }

  updateEmpleado(idEmpleado: number, empleado: Partial<Empleado>): Observable<Empleado> {
    return this.empleados.updateEmpleado(idEmpleado, empleado);
  }

  getAsignaciones(): Observable<Asignacion[]> {
    return this.asignaciones.getAsignaciones();
  }

  addAsignacion(asignacion: Partial<Asignacion>): Observable<Asignacion> {
    return this.asignaciones.addAsignacion(asignacion);
  }

  updateAsignacion(idAsignacion: number, asignacion: Partial<Asignacion>): Observable<Asignacion> {
    return this.asignaciones.updateAsignacion(idAsignacion, asignacion);
  }

  deleteAsignacion(idAsignacion: number): Observable<void> {
    return this.asignaciones.deleteAsignacion(idAsignacion);
  }
}
