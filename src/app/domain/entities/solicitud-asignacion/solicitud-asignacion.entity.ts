import type { Activo } from '../activo/activo.entity';
import type { Empleado } from '../empleado/empleado.entity';

export type EstadoSolicitudAsignacion =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'PENDIENTE_FIRMA'
  | 'FIRMADO'
  | 'COMPLETADO'
  | 'RECHAZADA'
  | 'RECHAZADO_FIRMA'
  | 'ASIGNADO'
  | string;

export type TipoDocumentoSolicitud = 'ORIGINAL' | 'FIRMADO';

export interface DocumentoSolicitudAsignacion {
  idDocumento?: number;
  tipoDocumento: TipoDocumentoSolicitud;
  version?: number;
  nombreArchivo?: string;
  fechaCarga?: Date;
}

export interface SolicitudAsignacion {
  idSolicitud: number;
  activo: Activo;
  empleado: Empleado;
  estadoSolicitud: EstadoSolicitudAsignacion;
  motivo?: string;
  fechaSolicitud: Date;
  fechaRespuesta?: Date;
  comentarioAdmin?: string;
  documentos?: DocumentoSolicitudAsignacion[];
}
