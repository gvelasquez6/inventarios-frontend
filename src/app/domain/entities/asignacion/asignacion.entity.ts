import type { Activo } from '../activo/activo.entity';
import type { Empleado } from '../empleado/empleado.entity';

export interface Asignacion {
  idAsignacion: number;
  fechaAsignacion: Date;
  fechaDevolucion?: Date;
  estado: string;
  activo: Activo;
  empleado: Empleado;
}
