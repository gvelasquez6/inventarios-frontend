import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { AuthService } from '../../application/use-cases/auth.service';
import { InventarioService } from '../../application/use-cases/inventario.service';
import { SolicitudAsignacionUseCase } from '../../application/use-cases/solicitud-asignacion.use-case';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Activo, EstadoActivo, SolicitudAsignacion } from '../../domain';
import { SolicitudConfirmarEliminarDialogComponent } from './dialogs/solicitud-confirmar-eliminar-dialog/solicitud-confirmar-eliminar-dialog.component';
import { SolicitudDetalleDialogComponent } from './dialogs/solicitud-detalle-dialog/solicitud-detalle-dialog.component';
import { SolicitudFirmadoDialogComponent } from './dialogs/solicitud-firmado-dialog/solicitud-firmado-dialog.component';
import { SolicitudFormDialogComponent } from './dialogs/solicitud-form-dialog/solicitud-form-dialog.component';
import { OpcionActivoSolicitud } from './models/solicitud-asignacion-dialog.models';

@Component({
  selector: 'app-solicitar-asignacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    InputTextModule,
    TableModule,
    SolicitudFormDialogComponent,
    SolicitudDetalleDialogComponent,
    SolicitudFirmadoDialogComponent,
    SolicitudConfirmarEliminarDialogComponent,
  ],
  templateUrl: './solicitar-asignacion.component.html',
  styleUrls: ['./solicitar-asignacion.component.scss'],
})
export class SolicitarAsignacionComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly inventario = inject(InventarioService);
  private readonly solicitudesService = inject(SolicitudAsignacionUseCase);
  private readonly notificacion = inject(NotificacionService);

  mostrarDialogo = false;
  idSolicitudEdicion: number | null = null;

  busqueda = '';
  solicitudes: SolicitudAsignacion[] = [];
  solicitudesFiltradas: SolicitudAsignacion[] = [];

  opcionesActivos: OpcionActivoSolicitud[] = [];

  enviando = false;
  solicitudDetalle: SolicitudAsignacion | null = null;
  mostrarDetalleSolicitud = false;
  mostrarConfirmarEliminar = false;
  solicitudAEliminar: SolicitudAsignacion | null = null;
  eliminandoSolicitud = false;

  solicitudParaFirma: SolicitudAsignacion | null = null;
  mostrarSubirFirmado = false;
  subiendoFirmado = false;
  stagedPdfFirmado: File | null = null;

  form = {
    idActivo: null as number | null,
    motivo: '',
  };

  ngOnInit(): void {
    this.cargarActivosDisponibles();
    this.cargarSolicitudes();
  }

  get tituloDialogoSolicitud(): string {
    return this.idSolicitudEdicion != null ? 'Editar solicitud de asignación' : 'Nueva solicitud de asignación';
  }

  get etiquetaBotonEnviar(): string {
    return this.idSolicitudEdicion != null ? 'Guardar cambios' : 'Solicitar';
  }

  esPendiente(s: SolicitudAsignacion): boolean {
    return this.estadoNormalizado(s) === 'PENDIENTE';
  }

  esPendienteFirma(s: SolicitudAsignacion): boolean {
    const estado = this.estadoNormalizado(s);
    return (
      estado === 'PENDIENTE_FIRMA' ||
      estado === 'APROBADA' ||
      estado === 'RECHAZADO_FIRMA'
    );
  }

  esRechazada(s: SolicitudAsignacion): boolean {
    const estado = this.estadoNormalizado(s);
    return estado === 'RECHAZADA' || estado === 'RECHAZADO_FIRMA';
  }

  motivoRechazo(s: SolicitudAsignacion): string {
    if (!this.esRechazada(s)) {
      return '—';
    }
    const comentario = s.comentarioAdmin?.trim();
    return comentario ? comentario : 'Sin comentario administrativo';
  }

  puedeDescargarPdfOriginal(s: SolicitudAsignacion): boolean {
    const estado = this.estadoNormalizado(s);
    return ['APROBADA', 'PENDIENTE_FIRMA', 'FIRMADO', 'COMPLETADO', 'RECHAZADO_FIRMA'].includes(estado);
  }

  abrirDialogo(): void {
    this.idSolicitudEdicion = null;
    this.form = { idActivo: null, motivo: '' };
    this.cargarActivosDisponibles();
    this.mostrarDialogo = true;
  }

  cerrarDialogo(): void {
    this.mostrarDialogo = false;
    this.idSolicitudEdicion = null;
    this.form = { idActivo: null, motivo: '' };
    this.enviando = false;
  }

  onVisibleDialogoSolicitud(visible: boolean): void {
    if (visible) {
      this.mostrarDialogo = true;
      return;
    }
    this.cerrarDialogo();
  }

  verDetalleSolicitud(s: SolicitudAsignacion): void {
    this.solicitudDetalle = s;
    this.mostrarDetalleSolicitud = true;
  }

  cerrarDetalleSolicitud(): void {
    this.mostrarDetalleSolicitud = false;
    this.solicitudDetalle = null;
  }

  onVisibleDetalleSolicitud(visible: boolean): void {
    if (visible) {
      this.mostrarDetalleSolicitud = true;
      return;
    }
    this.cerrarDetalleSolicitud();
  }

  editarSolicitud(s: SolicitudAsignacion): void {
    if (!this.esPendiente(s)) return;
    const idActivo = s.activo?.idActivo ?? null;
    this.idSolicitudEdicion = s.idSolicitud;
    this.form = { idActivo: idActivo != null ? Number(idActivo) : null, motivo: s.motivo?.trim() ?? '' };
    this.cargarActivosDisponibles();
    this.mostrarDialogo = true;
  }

  solicitarEliminarSolicitud(s: SolicitudAsignacion): void {
    if (!this.esPendiente(s)) return;
    this.solicitudAEliminar = s;
    this.mostrarConfirmarEliminar = true;
  }

  cancelarEliminarSolicitud(): void {
    this.mostrarConfirmarEliminar = false;
    this.solicitudAEliminar = null;
    this.eliminandoSolicitud = false;
  }

  confirmarEliminarSolicitud(): void {
    const s = this.solicitudAEliminar;
    const sesion = this.auth.session();
    const idEmpleadoSesion = sesion?.idEmpleado == null ? null : Number(sesion.idEmpleado);
    const idEmpleadoSolicitud = s?.empleado?.idEmpleado == null ? null : Number(s.empleado.idEmpleado);
    const idEmpleado =
      idEmpleadoSesion != null && Number.isFinite(idEmpleadoSesion)
        ? idEmpleadoSesion
        : idEmpleadoSolicitud != null && Number.isFinite(idEmpleadoSolicitud)
          ? idEmpleadoSolicitud
          : null;
    const idSolicitud = s == null ? NaN : Number(s.idSolicitud);

    if (s == null || !Number.isFinite(idSolicitud) || idEmpleado == null || !Number.isFinite(idEmpleado)) {
      this.notificacion.error(
        'No se pudo eliminar la solicitud: faltan datos de la solicitud o del empleado.',
        'Eliminar solicitud',
      );
      return;
    }
    if (this.eliminandoSolicitud) return;

    this.eliminandoSolicitud = true;
    this.solicitudesService.deleteSolicitud(idSolicitud, idEmpleado).subscribe({
      next: () => {
        this.mostrarConfirmarEliminar = false;
        this.solicitudAEliminar = null;
        this.notificacion.solicitudAsignacionEliminada();
        this.cargarSolicitudes();
        this.cargarActivosDisponibles();
        this.eliminandoSolicitud = false;
      },
      error: (err: Error) => {
        this.mostrarConfirmarEliminar = false;
        this.solicitudAEliminar = null;
        this.notificacion.error(err?.message ?? 'No se pudo eliminar la solicitud.');
        this.eliminandoSolicitud = false;
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
      `${s.activo?.tipo} ${s.activo?.marca} ${s.activo?.modelo} ${s.activo?.serial} ${s.estadoSolicitud} ${s.motivo ?? ''} ${s.comentarioAdmin ?? ''}`
        .toLowerCase()
        .includes(q),
    );
  }

  descargarPdfOriginal(solicitud: SolicitudAsignacion): void {
    if (!this.puedeDescargarPdfOriginal(solicitud)) return;
    this.solicitudesService.descargarPdfOriginal(solicitud.idSolicitud).subscribe({
      next: (blob) => this.descargarBlob(blob, 'acta-de-asignacion.pdf'),
      error: (err: Error) => this.notificacion.error(err?.message ?? 'No se pudo descargar el PDF original.'),
    });
  }

  abrirSubirFirmado(solicitud: SolicitudAsignacion): void {
    if (!this.esPendienteFirma(solicitud)) return;
    this.solicitudParaFirma = solicitud;
    this.mostrarSubirFirmado = true;
  }

  cerrarSubirFirmado(): void {
    if (this.subiendoFirmado) return;
    this.mostrarSubirFirmado = false;
    this.solicitudParaFirma = null;
    this.stagedPdfFirmado = null;
  }

  onVisibleSubirFirmado(visible: boolean): void {
    if (visible) {
      this.mostrarSubirFirmado = true;
      return;
    }
    this.cerrarSubirFirmado();
  }

  seleccionarPdfFirmado(event: { files?: File[] }): void {
    const archivo = event.files?.[0];
    if (!archivo) return;
    if (!this.esPdf(archivo)) {
      this.notificacion.error('Solo se permiten archivos PDF.');
      this.stagedPdfFirmado = null;
      return;
    }
    this.stagedPdfFirmado = this.normalizarNombrePdfFirmado(archivo);
  }

  quitarPdfFirmadoSeleccionado(): void {
    if (this.subiendoFirmado) return;
    this.stagedPdfFirmado = null;
  }

  subirPdfFirmadoSeleccionado(): void {
    const solicitud = this.solicitudParaFirma;
    const archivo = this.stagedPdfFirmado;
    if (!solicitud || !archivo || this.subiendoFirmado) return;

    this.subiendoFirmado = true;
    this.solicitudesService.subirPdfFirmado(solicitud.idSolicitud, archivo).subscribe({
      next: () => {
        this.notificacion.solicitudPdfFirmadoSubido();
        this.subiendoFirmado = false;
        this.stagedPdfFirmado = null;
        this.cerrarSubirFirmado();
        this.cargarSolicitudes();
      },
      error: (err: Error) => {
        this.notificacion.error(err?.message ?? 'No se pudo subir el PDF firmado.');
        this.subiendoFirmado = false;
      },
    });
  }

  enviarSolicitud(): void {
    const sesion = this.auth.session();
    const idEmpleado = sesion?.idEmpleado == null ? null : Number(sesion.idEmpleado);
    const idActivo = this.form.idActivo;
    if (idEmpleado == null || idActivo == null || this.enviando) return;

    this.enviando = true;
    const motivo = this.form.motivo?.trim() || undefined;
    const idEdicion = this.idSolicitudEdicion;
    const peticion =
      idEdicion != null
        ? this.solicitudesService.updateSolicitud(idEdicion, { idActivo, idEmpleado, motivo })
        : this.solicitudesService.addSolicitud({ idActivo, idEmpleado, motivo });

    peticion.subscribe({
      next: () => {
        if (idEdicion != null) {
          this.notificacion.solicitudAsignacionActualizada();
        } else {
          this.notificacion.solicitudAsignacionCreada();
        }
        this.cerrarDialogo();
        this.cargarSolicitudes();
        this.cargarActivosDisponibles();
        this.enviando = false;
      },
      error: (err: Error) => {
        this.notificacion.error(
          err?.message ?? (idEdicion != null ? 'No se pudo actualizar la solicitud.' : 'No se pudo crear la solicitud.'),
        );
        this.enviando = false;
      },
    });
  }

  private cargarActivosDisponibles(): void {
    const idActivoSeleccionado = this.form.idActivo;
    this.inventario.getActivos().subscribe({
      next: (list) => {
        const disponibles = list.filter((a) => a.estado === EstadoActivo.DISPONIBLE);
        const incluirSeleccionadoNoDisponible =
          idActivoSeleccionado != null && !disponibles.some((a) => a.idActivo === idActivoSeleccionado);
        const activosFormulario = incluirSeleccionadoNoDisponible
          ? list.filter((a) => a.idActivo === idActivoSeleccionado || a.estado === EstadoActivo.DISPONIBLE)
          : disponibles;
        this.opcionesActivos = activosFormulario.map((a) => ({
          label: `${a.tipo} · ${a.marca}${a.serial ? ` · ${a.serial}` : ''}`,
          value: a.idActivo,
        }));
      },
      error: (err: Error) => {
        this.opcionesActivos = [];
        this.notificacion.error(
          err?.message ?? 'No se pudo cargar los activos disponibles.',
          'Error al cargar activos',
        );
      },
    });
  }

  private cargarSolicitudes(): void {
    const sesion = this.auth.session();
    const idEmpleado = sesion?.idEmpleado == null ? null : Number(sesion.idEmpleado);
    if (idEmpleado == null) {
      this.solicitudes = [];
      this.solicitudesFiltradas = [];
      return;
    }
    this.solicitudesService.getSolicitudes(idEmpleado).subscribe({
      next: (list) => {
        this.solicitudes = list;
        this.filtrar();
      },
      error: (err: Error) => {
        this.solicitudes = [];
        this.solicitudesFiltradas = [];
        this.notificacion.error(err?.message ?? 'No se pudo cargar tus solicitudes.');
      },
    });
  }

  private estadoNormalizado(s: SolicitudAsignacion): string {
    return (s.estadoSolicitud ?? '').trim().toUpperCase();
  }

  private esPdf(archivo: File): boolean {
    return archivo.type === 'application/pdf' || archivo.name.toLowerCase().endsWith('.pdf');
  }

  private normalizarNombrePdfFirmado(archivo: File): File {
    const nombreEstandar = 'solicitud-firmada.pdf';
    if (archivo.name === nombreEstandar) {
      return archivo;
    }
    return new File([archivo], nombreEstandar, {
      type: archivo.type || 'application/pdf',
      lastModified: archivo.lastModified,
    });
  }

  private descargarBlob(blob: Blob, nombreArchivo: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = nombreArchivo;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}

