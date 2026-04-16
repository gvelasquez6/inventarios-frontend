import { Component, inject, OnInit } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';

import { DialogModule } from 'primeng/dialog';

import { InputTextModule } from 'primeng/inputtext';

import { SelectModule } from 'primeng/select';

import { TableModule } from 'primeng/table';

import { AuthService } from '../../application/use-cases/auth.service';

import { NotificacionService } from '../../core/services/notificacion.service';

import { SolicitudAsignacionUseCase } from '../../application/use-cases/solicitud-asignacion.use-case';

import { Activo, SolicitudAsignacion } from '../../domain';

import { InventarioService } from '../../application/use-cases/inventario.service';



interface OpcionActivoSolicitud {

  label: string;

  value: number;

}



@Component({

  selector: 'app-solicitar-asignacion',

  standalone: true,

  imports: [

    CommonModule,

    FormsModule,

    ButtonModule,

    DialogModule,

    InputTextModule,

    SelectModule,

    TableModule,

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

  /** `null` = alta nueva; número = edición de esa solicitud (solo PENDIENTE). */

  idSolicitudEdicion: number | null = null;



  busqueda = '';

  solicitudes: SolicitudAsignacion[] = [];

  solicitudesFiltradas: SolicitudAsignacion[] = [];

  activosDisponibles: Activo[] = [];

  opcionesActivos: OpcionActivoSolicitud[] = [];

  enviando = false;



  solicitudDetalle: SolicitudAsignacion | null = null;

  mostrarDetalleSolicitud = false;



  mostrarConfirmarEliminar = false;

  solicitudAEliminar: SolicitudAsignacion | null = null;

  /** Evita choque con `enviando` del formulario (p. ej. si se cerró el diálogo durante un POST). */

  eliminandoSolicitud = false;



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

    return (s.estadoSolicitud ?? '').trim().toUpperCase() === 'PENDIENTE';

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



  verDetalleSolicitud(s: SolicitudAsignacion): void {

    this.solicitudDetalle = s;

    this.mostrarDetalleSolicitud = true;

  }



  cerrarDetalleSolicitud(): void {

    this.mostrarDetalleSolicitud = false;

    this.solicitudDetalle = null;

  }



  editarSolicitud(s: SolicitudAsignacion): void {

    if (!this.esPendiente(s)) {

      return;

    }

    const idActivo = s.activo?.idActivo ?? null;

    this.idSolicitudEdicion = s.idSolicitud;

    this.form = {

      idActivo: idActivo != null ? Number(idActivo) : null,

      motivo: s.motivo?.trim() ?? '',

    };

    this.cargarActivosDisponibles();

    this.mostrarDialogo = true;

  }



  solicitarEliminarSolicitud(s: SolicitudAsignacion): void {

    if (!this.esPendiente(s)) {

      return;

    }

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

    const idEmpleadoSolicitud =

      s?.empleado?.idEmpleado == null ? null : Number(s.empleado.idEmpleado);

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

    if (this.eliminandoSolicitud) {

      return;

    }



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

      `${s.activo?.tipo} ${s.activo?.marca} ${s.activo?.modelo} ${s.activo?.serial} ${s.estadoSolicitud}`

        .toLowerCase()

        .includes(q),

    );

  }



  enviarSolicitud(): void {

    const sesion = this.auth.session();

    const idEmpleado = sesion?.idEmpleado == null ? null : Number(sesion.idEmpleado);

    const idActivo = this.form.idActivo;

    if (idEmpleado == null || idActivo == null || this.enviando) {

      return;

    }

    this.enviando = true;

    const motivo = this.form.motivo?.trim() || undefined;

    const idEdicion = this.idSolicitudEdicion;



    const peticion =

      idEdicion != null

        ? this.solicitudesService.updateSolicitud(idEdicion, {

            idActivo,

            idEmpleado,

            motivo,

          })

        : this.solicitudesService.addSolicitud({

            idActivo,

            idEmpleado,

            motivo,

          });



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

          err?.message ??

            (idEdicion != null ? 'No se pudo actualizar la solicitud.' : 'No se pudo crear la solicitud.'),

        );

        this.enviando = false;

      },

    });

  }



  private cargarActivosDisponibles(): void {

    this.inventario.getActivos().subscribe({

      next: (list) => {

        this.activosDisponibles = [...list];

        this.opcionesActivos = list.map((a) => ({

          label: `${a.tipo}`,

          value: a.idActivo,

        }));

      },

      error: (err: Error) => {

        this.activosDisponibles = [];

        this.opcionesActivos = [];

        this.notificacion.error(

          err?.message ?? 'No se pudo cargar el catálogo de activos.',

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

}

