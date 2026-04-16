import { inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../application/use-cases/auth.service';
import { SolicitudAsignacionUseCase } from '../../application/use-cases/solicitud-asignacion.use-case';
import { SolicitudAsignacion } from '../../domain';

export type TipoNotificacion = 'pendiente' | 'aprobada' | 'rechazada' | 'asignada';

export interface NotificacionCentro {
  id: string;
  tipo: TipoNotificacion;
  titulo: string;
  detalle: string;
  fecha: Date;
  rutaDestino: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionesCentroService {
  private readonly auth = inject(AuthService);
  private readonly solicitudesService = inject(SolicitudAsignacionUseCase);

  obtenerNotificaciones(): Observable<NotificacionCentro[]> {
    const sesion = this.auth.session();
    if (!sesion) {
      return of([]);
    }

    if (sesion.rol === 'Administrador') {
      return this.solicitudesService
        .getSolicitudes()
        .pipe(map((list) => this.armarParaAdministrador(list)));
    }

    const idEmpleado = sesion.idEmpleado == null ? null : Number(sesion.idEmpleado);
    if (idEmpleado == null || !Number.isFinite(idEmpleado)) {
      return of([]);
    }
    return this.solicitudesService
      .getSolicitudes(idEmpleado)
      .pipe(map((list) => this.armarParaFuncionario(list)));
  }

  obtenerTotalCampana(): Observable<number> {
    return this.obtenerNotificaciones().pipe(map((list) => list.length));
  }

  private armarParaAdministrador(list: SolicitudAsignacion[]): NotificacionCentro[] {
    return list
      .filter((s) => this.estadoNormalizado(s.estadoSolicitud) === 'PENDIENTE')
      .map((s) => ({
        id: `solicitud-pendiente-${s.idSolicitud}`,
        tipo: 'pendiente' as const,
        titulo: 'Solicitud pendiente por revisar',
        detalle: `${s.empleado?.nombre ?? 'Funcionario'} solicitó ${s.activo?.tipo ?? 'un activo'} (${s.activo?.serial ?? 'sin serial'}).`,
        fecha: s.fechaSolicitud,
        rutaDestino: '/solicitudes-pendientes',
      }))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  private armarParaFuncionario(list: SolicitudAsignacion[]): NotificacionCentro[] {
    return list
      .filter((s) => this.estadoNormalizado(s.estadoSolicitud) !== 'PENDIENTE')
      .map((s) => this.mapearNotificacionFuncionario(s))
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }

  private mapearNotificacionFuncionario(s: SolicitudAsignacion): NotificacionCentro {
    const estado = this.estadoNormalizado(s.estadoSolicitud);
    if (estado === 'ASIGNADO') {
      return {
        id: `solicitud-asignada-${s.idSolicitud}`,
        tipo: 'asignada',
        titulo: 'Activo asignado',
        detalle: `Tu solicitud para ${s.activo?.tipo ?? 'el activo solicitado'} ya fue asignada.`,
        fecha: s.fechaRespuesta ?? s.fechaSolicitud,
        rutaDestino: '/mis-asignaciones',
      };
    }
    if (estado === 'APROBADA') {
      return {
        id: `solicitud-aprobada-${s.idSolicitud}`,
        tipo: 'aprobada',
        titulo: 'Solicitud aprobada',
        detalle: `Tu solicitud para ${s.activo?.tipo ?? 'el activo solicitado'} fue aprobada.`,
        fecha: s.fechaRespuesta ?? s.fechaSolicitud,
        rutaDestino: '/solicitar-asignacion',
      };
    }
    return {
      id: `solicitud-rechazada-${s.idSolicitud}`,
      tipo: 'rechazada',
      titulo: 'Solicitud rechazada',
      detalle: `Tu solicitud para ${s.activo?.tipo ?? 'el activo solicitado'} fue rechazada.`,
      fecha: s.fechaRespuesta ?? s.fechaSolicitud,
      rutaDestino: '/solicitar-asignacion',
    };
  }

  private estadoNormalizado(estado: string | undefined): string {
    return (estado ?? '').trim().toUpperCase();
  }
}
