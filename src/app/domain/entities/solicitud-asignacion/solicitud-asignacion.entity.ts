import type { Activo } from '../activo/activo.entity';
import type { Empleado } from '../empleado/empleado.entity';

export interface SolicitudAsignacion {
  idSolicitud: number;
  activo: Activo;
  empleado: Empleado;
  estadoSolicitud: string;
  motivo?: string;
  fechaSolicitud: Date;
  fechaRespuesta?: Date;
  comentarioAdmin?: string;
}
