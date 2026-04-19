import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { NotificacionService } from '../../core/services/notificacion.service';
import { SolicitudAsignacionUseCase } from '../../application/use-cases/solicitud-asignacion.use-case';
import { SolicitudAsignacion } from '../../domain';

@Component({
  selector: 'app-solicitudes-pendientes',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, DialogModule, InputTextModule, TableModule],
  templateUrl: './solicitudes-pendientes.component.html',
  styleUrls: ['./solicitudes-pendientes.component.scss'],
})
export class SolicitudesPendientesComponent implements OnInit, OnDestroy {
  private readonly solicitudesService = inject(SolicitudAsignacionUseCase);
  private readonly notificacion = inject(NotificacionService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);

  busqueda = '';
  solicitudes: SolicitudAsignacion[] = [];
  solicitudesFiltradas: SolicitudAsignacion[] = [];

  solicitudDetalle: SolicitudAsignacion | null = null;
  mostrarDetalle = false;

  solicitudEnProceso: SolicitudAsignacion | null = null;
  mostrarConfirmarAprobar = false;
  mostrarConfirmarRechazar = false;
  modoAprobacion: 'inicial' | 'final' = 'inicial';
  modoRechazo: 'inicial' | 'firma' = 'inicial';
  comentarioAdmin = '';
  procesando = false;
  intentoRechazo = false;
  private autoRefreshId: ReturnType<typeof setInterval> | null = null;
  mostrarVisorPdfFirmado = false;
  visorPdfFirmadoUrl: string | null = null;
  visorPdfFirmadoSafeUrl: SafeResourceUrl | null = null;
  visorPdfFirmadoCargando = false;
  private visorPdfSolicitudSeq = 0;

  get mostrarErrorComentarioRechazo(): boolean {
    return this.intentoRechazo && this.comentarioAdmin.trim().length < 8;
  }

  ngOnInit(): void {
    this.cargarSolicitudesPendientes();
    this.autoRefreshId = setInterval(() => this.cargarSolicitudesPendientes(), 15000);
  }

  ngOnDestroy(): void {
    if (this.autoRefreshId != null) {
      clearInterval(this.autoRefreshId);
      this.autoRefreshId = null;
    }
    this.limpiarVisorPdfFirmado();
  }

  irACrearAsignacion(solicitud: SolicitudAsignacion): void {
    const idEmpleado = solicitud.empleado?.idEmpleado;
    const idActivo = solicitud.activo?.idActivo;
    if (idEmpleado == null || idActivo == null) {
      this.notificacion.error(
        'No hay datos suficientes para abrir el formulario de asignación.',
        'Crear asignación',
      );
      return;
    }
    this.router.navigate(['/asignaciones'], {
      queryParams: { idEmpleado, idActivo },
    });
  }

  verDetalle(solicitud: SolicitudAsignacion): void {
    this.solicitudDetalle = solicitud;
    this.mostrarDetalle = true;
  }

  cerrarDetalle(): void {
    this.mostrarDetalle = false;
    this.solicitudDetalle = null;
  }

  abrirAprobar(solicitud: SolicitudAsignacion): void {
    if (!this.esPendiente(solicitud)) return;
    this.solicitudEnProceso = solicitud;
    this.modoAprobacion = 'inicial';
    this.modoRechazo = 'inicial';
    this.comentarioAdmin = '';
    this.mostrarConfirmarAprobar = true;
  }

  abrirAprobarFinal(solicitud: SolicitudAsignacion): void {
    if (!this.esFirmado(solicitud)) return;
    this.solicitudEnProceso = solicitud;
    this.modoAprobacion = 'final';
    this.modoRechazo = 'firma';
    this.comentarioAdmin = '';
    this.mostrarConfirmarAprobar = true;
  }

  cerrarAprobar(): void {
    if (this.procesando) return;
    this.mostrarConfirmarAprobar = false;
    this.solicitudEnProceso = null;
    this.comentarioAdmin = '';
    this.modoAprobacion = 'inicial';
  }

  confirmarAprobar(): void {
    const solicitud = this.solicitudEnProceso;
    if (!solicitud || this.procesando) return;

    this.procesando = true;
    const peticion =
      this.modoAprobacion === 'final'
        ? this.solicitudesService.aprobarFinal(solicitud.idSolicitud, this.comentarioAdmin.trim() || undefined)
        : this.solicitudesService.aprobarSolicitud(solicitud.idSolicitud, this.comentarioAdmin.trim() || undefined);
    peticion.subscribe({
      next: () => {
        this.procesando = false;
        if (this.modoAprobacion === 'final') {
          this.notificacion.solicitudFirmaAprobadaFinal();
        } else {
          this.notificacion.solicitudPendienteFirma();
        }
        this.cerrarAprobar();
        this.cargarSolicitudesPendientes();
      },
      error: (err: Error) => {
        this.notificacion.error(
          err?.message ??
            (this.modoAprobacion === 'final'
              ? 'No se pudo aprobar la revisión final.'
              : 'No se pudo aprobar la solicitud.'),
        );
        this.procesando = false;
      },
    });
  }

  abrirRechazar(solicitud: SolicitudAsignacion): void {
    if (!this.esPendiente(solicitud)) return;
    this.solicitudEnProceso = solicitud;
    this.modoRechazo = 'inicial';
    this.comentarioAdmin = '';
    this.intentoRechazo = false;
    this.mostrarConfirmarRechazar = true;
  }

  abrirRechazarFirma(solicitud: SolicitudAsignacion): void {
    if (!this.esFirmado(solicitud)) return;
    this.solicitudEnProceso = solicitud;
    this.modoRechazo = 'firma';
    this.comentarioAdmin = '';
    this.intentoRechazo = false;
    this.mostrarConfirmarRechazar = true;
  }

  cerrarRechazar(): void {
    if (this.procesando) return;
    this.mostrarConfirmarRechazar = false;
    this.solicitudEnProceso = null;
    this.comentarioAdmin = '';
    this.intentoRechazo = false;
    this.modoRechazo = 'inicial';
  }

  confirmarRechazar(): void {
    const solicitud = this.solicitudEnProceso;
    if (!solicitud || this.procesando) return;
    this.intentoRechazo = true;
    if (this.comentarioAdmin.trim().length < 8) {
      return;
    }

    this.procesando = true;
    const comentario = this.comentarioAdmin.trim();
    const peticion =
      this.modoRechazo === 'firma'
        ? this.solicitudesService.rechazarFirma(solicitud.idSolicitud, comentario)
        : this.solicitudesService.rechazarSolicitud(solicitud.idSolicitud, comentario || undefined);
    peticion.subscribe({
      next: () => {
        this.procesando = false;
        if (this.modoRechazo === 'firma') {
          this.notificacion.solicitudFirmaRechazadaFinal();
        } else {
          this.notificacion.solicitudAsignacionRechazada();
        }
        this.cerrarRechazar();
        this.cargarSolicitudesPendientes();
      },
      error: (err: Error) => {
        this.notificacion.error(
          err?.message ??
            (this.modoRechazo === 'firma'
              ? 'No se pudo rechazar la firma final.'
              : 'No se pudo rechazar la solicitud.'),
        );
        this.procesando = false;
      },
    });
  }

  verPdfFirmado(solicitud: SolicitudAsignacion, event?: Event): void {
    event?.stopPropagation();
    if (!this.puedeDescargarFirmado(solicitud)) return;
    const seq = ++this.visorPdfSolicitudSeq;
    this.revocarBlobVisorPdf();
    this.visorPdfFirmadoCargando = true;
    this.mostrarVisorPdfFirmado = true;
    this.cdr.detectChanges();

    this.solicitudesService.descargarPdfFirmado(solicitud.idSolicitud).subscribe({
      next: (blob) => {
        if (seq !== this.visorPdfSolicitudSeq || !this.mostrarVisorPdfFirmado) {
          return;
        }
        this.aplicarBlobVisorPdfFirmado(blob);
        this.cdr.detectChanges();
      },
      error: (err: Error) => {
        if (seq !== this.visorPdfSolicitudSeq) {
          return;
        }
        this.notificacion.error(err?.message ?? 'No se pudo abrir el PDF firmado.');
        this.cerrarVisorPdfFirmado();
      },
    });
  }

  cerrarVisorPdfFirmado(): void {
    this.mostrarVisorPdfFirmado = false;
    this.visorPdfFirmadoCargando = false;
    this.revocarBlobVisorPdf();
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase().trim();
    if (!q) {
      this.solicitudesFiltradas = [...this.solicitudes];
      return;
    }

    this.solicitudesFiltradas = this.solicitudes.filter((s) =>
      `${s.empleado?.nombre} ${s.activo?.tipo} ${s.activo?.marca} ${s.activo?.serial} ${s.estadoSolicitud} ${s.motivo ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  }

  etiquetaEstado(solicitud: SolicitudAsignacion): string {
    const e = (solicitud.estadoSolicitud ?? '').trim().toUpperCase();
    if (e === 'PENDIENTE_FIRMA') return 'Pendiente firma';
    if (e === 'FIRMADO') return 'Firmado';
    if (e === 'COMPLETADO') return 'Completado';
    if (e === 'RECHAZADO_FIRMA') return 'Rechazado firma';
    if (e === 'APROBADA') return 'Aprobada';
    if (e === 'RECHAZADA') return 'Rechazada';
    if (e === 'ASIGNADO') return 'Asignado';
    if (e === 'PENDIENTE') return 'Pendiente';
    return solicitud.estadoSolicitud ?? '—';
  }

  claseEstadoFila(solicitud: SolicitudAsignacion): string {
    const e = (solicitud.estadoSolicitud ?? '').trim().toUpperCase();
    if (e === 'PENDIENTE_FIRMA') return 'estado-pendiente-firma';
    if (e === 'FIRMADO') return 'estado-firmado';
    if (e === 'COMPLETADO') return 'estado-completado';
    if (e === 'RECHAZADO_FIRMA') return 'estado-rechazado-firma';
    if (e === 'APROBADA') return 'estado-aprobada';
    if (e === 'RECHAZADA') return 'estado-rechazada';
    if (e === 'ASIGNADO') return 'estado-asignado';
    return 'estado-pendiente';
  }

  /** Enlace a crear asignación solo tras aprobar la firma (flujo finalizado). */
  esPuedeIrACrearAsignacion(solicitud: SolicitudAsignacion): boolean {
    const e = (solicitud.estadoSolicitud ?? '').trim().toUpperCase();
    return e === 'COMPLETADO';
  }

  esFirmado(solicitud: SolicitudAsignacion): boolean {
    return (solicitud.estadoSolicitud ?? '').trim().toUpperCase() === 'FIRMADO';
  }

  puedeDescargarFirmado(solicitud: SolicitudAsignacion): boolean {
    const e = (solicitud.estadoSolicitud ?? '').trim().toUpperCase();
    return ['FIRMADO', 'COMPLETADO', 'RECHAZADO_FIRMA'].includes(e);
  }

  tituloDialogoAprobar(): string {
    return this.modoAprobacion === 'final' ? 'Aprobar revisión final' : 'Aprobar solicitud';
  }

  tituloDialogoRechazar(): string {
    return this.modoRechazo === 'firma' ? 'Rechazar firma' : 'Rechazar solicitud';
  }

  etiquetaBotonAprobar(): string {
    return this.modoAprobacion === 'final' ? 'Aprobar final' : 'Aprobar';
  }

  etiquetaBotonRechazar(): string {
    return this.modoRechazo === 'firma' ? 'Rechazar firma' : 'Rechazar';
  }

  private cargarSolicitudesPendientes(): void {
    this.solicitudesService.getSolicitudes().subscribe({
      next: (list) => {
        this.solicitudes = [...list].sort((a, b) => this.compararSolicitudesOrden(a, b));
        this.filtrar();
      },
      error: (err: Error) => {
        this.solicitudes = [];
        this.solicitudesFiltradas = [];
        this.notificacion.error(err?.message ?? 'No se pudo cargar las solicitudes pendientes.');
      },
    });
  }

  /** Pendientes primero; luego por fecha de respuesta o solicitud (más reciente arriba). */
  private compararSolicitudesOrden(a: SolicitudAsignacion, b: SolicitudAsignacion): number {
    const pa = this.esPendiente(a) ? 0 : 1;
    const pb = this.esPendiente(b) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const fa = this.fechaOrdenLista(a).getTime();
    const fb = this.fechaOrdenLista(b).getTime();
    return fb - fa;
  }

  private fechaOrdenLista(s: SolicitudAsignacion): Date {
    if (this.esPendiente(s)) {
      return s.fechaSolicitud instanceof Date ? s.fechaSolicitud : new Date(s.fechaSolicitud as unknown as string);
    }
    const fr = s.fechaRespuesta;
    if (fr != null) {
      return fr instanceof Date ? fr : new Date(fr as unknown as string);
    }
    return s.fechaSolicitud instanceof Date ? s.fechaSolicitud : new Date(s.fechaSolicitud as unknown as string);
  }

  esPendiente(solicitud: SolicitudAsignacion): boolean {
    return (solicitud.estadoSolicitud ?? '').trim().toUpperCase() === 'PENDIENTE';
  }

  private aplicarBlobVisorPdfFirmado(blob: Blob): void {
    this.revocarBlobVisorPdf();
    this.visorPdfFirmadoUrl = URL.createObjectURL(blob);
    this.visorPdfFirmadoSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.visorPdfFirmadoUrl);
    this.visorPdfFirmadoCargando = false;
  }

  private limpiarVisorPdfFirmado(): void {
    this.visorPdfFirmadoCargando = false;
    this.revocarBlobVisorPdf();
  }

  private revocarBlobVisorPdf(): void {
    if (this.visorPdfFirmadoUrl) {
      URL.revokeObjectURL(this.visorPdfFirmadoUrl);
      this.visorPdfFirmadoUrl = null;
    }
    this.visorPdfFirmadoSafeUrl = null;
  }
}
