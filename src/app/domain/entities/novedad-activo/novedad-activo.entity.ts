import type { Activo } from '../activo/activo.entity';
import type { Empleado } from '../empleado/empleado.entity';

export type TipoNovedadActivo = 'DANO' | 'PERDIDA' | 'OTRO';

export type EstadoNovedadActivo = 'PENDIENTE' | 'ENVIADO_MANTENIMIENTO' | 'CERRADO';

export interface NovedadActivo {
  idNovedad: number;
  activo: Activo;
  empleado: Empleado;
  idAsignacion?: number | null;
  tipo: TipoNovedadActivo | string;
  descripcion: string;
  fechaReporte: Date;
  estado: EstadoNovedadActivo | string;
  comentarioAdmin?: string | null;
  fechaRespuesta?: Date | null;
  /** Cierre tras flujo de mantenimiento (activo vuelve a asignado / listo para recoger). */
  cerradaTrasMantenimiento?: boolean;
}
