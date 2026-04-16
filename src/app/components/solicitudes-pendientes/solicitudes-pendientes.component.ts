import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
export class SolicitudesPendientesComponent implements OnInit {
  private readonly solicitudesService = inject(SolicitudAsignacionUseCase);
  private readonly notificacion = inject(NotificacionService);
  private readonly router = inject(Router);

  busqueda = '';
  solicitudes: SolicitudAsignacion[] = [];
  solicitudesFiltradas: SolicitudAsignacion[] = [];

  solicitudDetalle: SolicitudAsignacion | null = null;
  mostrarDetalle = false;

  solicitudEnProceso: SolicitudAsignacion | null = null;
  mostrarConfirmarAprobar = false;
  mostrarConfirmarRechazar = false;
  comentarioAdmin = '';
  procesando = false;
  intentoRechazo = false;

  get mostrarErrorComentarioRechazo(): boolean {
    return this.intentoRechazo && this.comentarioAdmin.trim().length < 8;
  }

  ngOnInit(): void {
    this.cargarSolicitudesPendientes();
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
    this.comentarioAdmin = '';
    this.mostrarConfirmarAprobar = true;
  }

  cerrarAprobar(): void {
    if (this.procesando) return;
    this.mostrarConfirmarAprobar = false;
    this.solicitudEnProceso = null;
    this.comentarioAdmin = '';
  }

  confirmarAprobar(): void {
    const solicitud = this.solicitudEnProceso;
    if (!solicitud || this.procesando) return;

    this.procesando = true;
    this.solicitudesService
      .aprobarSolicitud(solicitud.idSolicitud, this.comentarioAdmin.trim() || undefined)
      .subscribe({
        next: () => {
          this.procesando = false;
          this.notificacion.solicitudAsignacionAprobada();
          this.cerrarAprobar();
          this.cargarSolicitudesPendientes();
        },
        error: (err: Error) => {
          this.notificacion.error(err?.message ?? 'No se pudo aprobar la solicitud.');
          this.procesando = false;
        },
      });
  }

  abrirRechazar(solicitud: SolicitudAsignacion): void {
    if (!this.esPendiente(solicitud)) return;
    this.solicitudEnProceso = solicitud;
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
  }

  confirmarRechazar(): void {
    const solicitud = this.solicitudEnProceso;
    if (!solicitud || this.procesando) return;
    this.intentoRechazo = true;
    if (this.comentarioAdmin.trim().length < 8) {
      return;
    }

    this.procesando = true;
    this.solicitudesService
      .rechazarSolicitud(solicitud.idSolicitud, this.comentarioAdmin.trim() || undefined)
      .subscribe({
        next: () => {
          this.procesando = false;
          this.notificacion.solicitudAsignacionRechazada();
          this.cerrarRechazar();
          this.cargarSolicitudesPendientes();
        },
        error: (err: Error) => {
          this.notificacion.error(err?.message ?? 'No se pudo rechazar la solicitud.');
          this.procesando = false;
        },
      });
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
    if (e === 'APROBADA') return 'Aprobada';
    if (e === 'RECHAZADA') return 'Rechazada';
    if (e === 'ASIGNADO') return 'Asignado';
    if (e === 'PENDIENTE') return 'Pendiente';
    return solicitud.estadoSolicitud ?? '—';
  }

  claseEstadoFila(solicitud: SolicitudAsignacion): string {
    const e = (solicitud.estadoSolicitud ?? '').trim().toUpperCase();
    if (e === 'APROBADA') return 'estado-aprobada';
    if (e === 'RECHAZADA') return 'estado-rechazada';
    if (e === 'ASIGNADO') return 'estado-asignado';
    return 'estado-pendiente';
  }

  /** Enlace a crear asignación solo tras aprobar la solicitud (no en pendiente de revisión). */
  esPuedeIrACrearAsignacion(solicitud: SolicitudAsignacion): boolean {
    const e = (solicitud.estadoSolicitud ?? '').trim().toUpperCase();
    return e === 'APROBADA';
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
}
