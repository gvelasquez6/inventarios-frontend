import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../../application/use-cases/auth.service';
import { NovedadActivoUseCase } from '../../application/use-cases/novedad-activo.use-case';
import { SolicitudAsignacionUseCase } from '../../application/use-cases/solicitud-asignacion.use-case';
import { NovedadActivo, SolicitudAsignacion } from '../../domain';

export type TipoNotificacion =
  | 'pendiente'
  | 'aprobada'
  | 'pendiente_firma'
  | 'firmado'
  | 'completada'
  | 'rechazada'
  | 'rechazada_firma'
  | 'asignada'
  | 'novedad_pendiente'
  | 'novedad_gestionada'
  | 'novedad_mantenimiento'
  | 'novedad_listo_recogida';

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
  private readonly novedadesService = inject(NovedadActivoUseCase);

  obtenerNotificaciones(): Observable<NotificacionCentro[]> {
    const sesion = this.auth.session();
    if (!sesion) {
      return of([]);
    }

    if (sesion.rol === 'Administrador') {
      return forkJoin({
        solicitudes: this.solicitudesService.getSolicitudes(),
        novedades: this.novedadesService.getNovedades().pipe(catchError(() => of([]))),
      }).pipe(
        map(({ solicitudes, novedades }) =>
          this.combinarYOrdenar(
            this.armarListaSolicitudesAdministrador(solicitudes),
            this.armarNovedadesAdministrador(novedades),
          ),
        ),
      );
    }

    const idEmpleado = sesion.idEmpleado == null ? null : Number(sesion.idEmpleado);
    if (idEmpleado == null || !Number.isFinite(idEmpleado)) {
      return of([]);
    }
    return forkJoin({
      solicitudes: this.solicitudesService.getSolicitudes(idEmpleado),
      novedades: this.novedadesService.getMisNovedades(idEmpleado).pipe(catchError(() => of([]))),
    }).pipe(
      map(({ solicitudes, novedades }) =>
        this.combinarYOrdenar(
          this.armarListaSolicitudesFuncionario(solicitudes),
          this.armarNovedadesFuncionario(novedades),
        ),
      ),
    );
  }

  obtenerTotalCampana(): Observable<number> {
    return this.obtenerNotificaciones().pipe(map((list) => list.length));
  }

  private combinarYOrdenar(a: NotificacionCentro[], b: NotificacionCentro[]): NotificacionCentro[] {
    return [...a, ...b].sort((x, y) => y.fecha.getTime() - x.fecha.getTime());
  }

  private armarListaSolicitudesAdministrador(list: SolicitudAsignacion[]): NotificacionCentro[] {
    return list
      .filter((s) => {
        const estado = this.estadoNormalizado(s.estadoSolicitud);
        return estado === 'PENDIENTE' || estado === 'FIRMADO';
      })
      .map((s) => this.mapearNotificacionAdministrador(s));
  }

  private armarListaSolicitudesFuncionario(list: SolicitudAsignacion[]): NotificacionCentro[] {
    return list
      .filter((s) => this.estadoNormalizado(s.estadoSolicitud) !== 'PENDIENTE')
      .map((s) => this.mapearNotificacionFuncionario(s));
  }

  private armarNovedadesAdministrador(novedades: NovedadActivo[]): NotificacionCentro[] {
    return novedades
      .filter((n) => this.estadoNormalizado(n.estado) === 'PENDIENTE')
      .map((n) => ({
        id: `admin-novedad-${n.idNovedad}-pendiente`,
        tipo: 'novedad_pendiente',
        titulo: 'Nueva novedad de activo',
        detalle: `${n.empleado?.nombre ?? 'Un funcionario'} reportó ${this.detalleTipoNovedad(
          n.tipo,
        )} sobre ${n.activo?.tipo ?? 'un activo'} (${n.activo?.serial ?? 'sin serial'}).`,
        fecha: n.fechaReporte instanceof Date ? n.fechaReporte : new Date(n.fechaReporte as unknown as string),
        rutaDestino: '/novedades-activo',
      }));
  }

  private armarNovedadesFuncionario(novedades: NovedadActivo[]): NotificacionCentro[] {
    return novedades
      .filter((n) => {
        const e = this.estadoNormalizado(n.estado);
        if (e !== 'ENVIADO_MANTENIMIENTO' && e !== 'CERRADO') {
          return false;
        }
        return n.fechaRespuesta != null;
      })
      .map((n) => {
        const e = this.estadoNormalizado(n.estado);
        const fecha =
          n.fechaRespuesta instanceof Date
            ? n.fechaRespuesta
            : new Date(n.fechaRespuesta as unknown as string);
        const tipoActivo = n.activo?.tipo ?? 'el activo';
        const serial = n.activo?.serial ? ` (${n.activo.serial})` : '';

        if (e === 'ENVIADO_MANTENIMIENTO') {
          return {
            id: `funcionario-novedad-${n.idNovedad}-mantenimiento-${this.marcaTiempo(fecha)}`,
            tipo: 'novedad_mantenimiento' as const,
            titulo: 'Activo en mantenimiento',
            detalle: `Tu activo ${tipoActivo}${serial} quedó en mantenimiento. Lo verás así en Mis asignaciones hasta que finalice el arreglo.`,
            fecha,
            rutaDestino: '/mis-asignaciones',
          };
        }

        const listo = n.cerradaTrasMantenimiento === true;
        if (listo) {
          return {
            id: `funcionario-novedad-${n.idNovedad}-listo-${this.marcaTiempo(fecha)}`,
            tipo: 'novedad_listo_recogida' as const,
            titulo: 'Activo reparado — puedes recogerlo',
            detalle: `El activo ${tipoActivo}${serial} ya fue reparado. Puedes recogerlo; revisa Mis asignaciones (estado Asignado).`,
            fecha,
            rutaDestino: '/mis-asignaciones',
          };
        }

        return {
          id: `funcionario-novedad-${n.idNovedad}-cerrado-${this.marcaTiempo(fecha)}`,
          tipo: 'novedad_gestionada' as const,
          titulo: 'Reporte cerrado',
          detalle: `Tu novedad sobre ${tipoActivo}${serial} fue cerrada por administración.`,
          fecha,
          rutaDestino: '/reportar-novedad',
        };
      });
  }

  private detalleTipoNovedad(tipo: string | undefined): string {
    const u = this.estadoNormalizado(tipo);
    if (u === 'DANO') return 'un daño';
    if (u === 'PERDIDA') return 'una pérdida';
    return 'una incidencia';
  }

  private mapearNotificacionFuncionario(s: SolicitudAsignacion): NotificacionCentro {
    const estado = this.estadoNormalizado(s.estadoSolicitud);
    if (estado === 'PENDIENTE_FIRMA' || estado === 'APROBADA') {
      return {
        id: this.construirIdNotificacion('funcionario-pendiente-firma', s),
        tipo: 'pendiente_firma',
        titulo: 'PDF listo para firmar',
        detalle: `Tu solicitud de ${s.activo?.tipo ?? 'activo'} fue aprobada. Descarga, firma y carga el PDF.`,
        fecha: s.fechaRespuesta ?? s.fechaSolicitud,
        rutaDestino: '/solicitar-asignacion',
      };
    }

    if (estado === 'FIRMADO') {
      return {
        id: this.construirIdNotificacion('funcionario-firmado', s),
        tipo: 'firmado',
        titulo: 'PDF firmado recibido',
        detalle: `Recibimos tu PDF firmado de ${s.activo?.tipo ?? 'activo'}. Está pendiente de validación final.`,
        fecha: s.fechaRespuesta ?? s.fechaSolicitud,
        rutaDestino: '/solicitar-asignacion',
      };
    }

    if (estado === 'COMPLETADO') {
      return {
        id: this.construirIdNotificacion('funcionario-completada', s),
        tipo: 'completada',
        titulo: 'Firma aprobada',
        detalle: `La firma de tu solicitud para ${s.activo?.tipo ?? 'el activo solicitado'} fue aprobada.`,
        fecha: s.fechaRespuesta ?? s.fechaSolicitud,
        rutaDestino: '/solicitar-asignacion',
      };
    }

    if (estado === 'ASIGNADO') {
      return {
        id: this.construirIdNotificacion('funcionario-asignada', s),
        tipo: 'asignada',
        titulo: 'Activo asignado',
        detalle: `Tu solicitud para ${s.activo?.tipo ?? 'el activo solicitado'} ya fue asignada.`,
        fecha: s.fechaRespuesta ?? s.fechaSolicitud,
        rutaDestino: '/mis-asignaciones',
      };
    }

    if (estado === 'RECHAZADO_FIRMA') {
      return {
        id: this.construirIdNotificacion('funcionario-rechazada-firma', s),
        tipo: 'rechazada_firma',
        titulo: 'Firma rechazada',
        detalle: `La firma de ${s.activo?.tipo ?? 'tu solicitud'} fue rechazada. Revisa el comentario del administrador.`,
        fecha: s.fechaRespuesta ?? s.fechaSolicitud,
        rutaDestino: '/solicitar-asignacion',
      };
    }

    return {
      id: this.construirIdNotificacion('funcionario-rechazada', s),
      tipo: 'rechazada',
      titulo: 'Solicitud rechazada',
      detalle: `Tu solicitud para ${s.activo?.tipo ?? 'el activo solicitado'} fue rechazada.`,
      fecha: s.fechaRespuesta ?? s.fechaSolicitud,
      rutaDestino: '/solicitar-asignacion',
    };
  }

  private mapearNotificacionAdministrador(s: SolicitudAsignacion): NotificacionCentro {
    const estado = this.estadoNormalizado(s.estadoSolicitud);
    if (estado === 'FIRMADO') {
      return {
        id: this.construirIdNotificacion('admin-firmado', s),
        tipo: 'firmado',
        titulo: 'PDF firmado por validar',
        detalle: `${s.empleado?.nombre ?? 'Funcionario'} cargó el PDF firmado de ${s.activo?.tipo ?? 'activo'}.`,
        fecha: s.fechaRespuesta ?? s.fechaSolicitud,
        rutaDestino: '/solicitudes-pendientes',
      };
    }
    return {
      id: this.construirIdNotificacion('admin-pendiente', s),
      tipo: 'pendiente',
      titulo: 'Solicitud pendiente por revisar',
      detalle: `${s.empleado?.nombre ?? 'Funcionario'} solicitó ${s.activo?.tipo ?? 'un activo'} (${s.activo?.serial ?? 'sin serial'}).`,
      fecha: s.fechaSolicitud,
      rutaDestino: '/solicitudes-pendientes',
    };
  }

  private construirIdNotificacion(prefijo: string, s: SolicitudAsignacion): string {
    const estado = this.estadoNormalizado(s.estadoSolicitud).toLowerCase();
    const marcaTiempo = this.marcaTiempo(s.fechaRespuesta ?? s.fechaSolicitud);
    return `${prefijo}-${s.idSolicitud}-${estado}-${marcaTiempo}`;
  }

  private estadoNormalizado(estado: string | undefined): string {
    return (estado ?? '').trim().toUpperCase();
  }

  private marcaTiempo(fecha: Date): number {
    const d = fecha instanceof Date ? fecha : new Date(fecha);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  }
}
