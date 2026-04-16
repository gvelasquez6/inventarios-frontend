import { Component, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import * as XLSX from 'xlsx';
import { InventarioService } from '../../application/use-cases/inventario.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Activo, Asignacion, Empleado } from '../../domain';
import {
  FormNuevaAsignacionComponent,
  FormNuevaAsignacionModel,
} from './form-nueva-asignacion/form-nueva-asignacion.component';
import { CapitalizeFirstDirective } from '../../shared/directives/capitalize-first.directive';

@Component({
  selector: 'app-asignacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    FormNuevaAsignacionComponent,
    CapitalizeFirstDirective,
  ],
  templateUrl: './asignacion.component.html',
  styleUrls: ['./asignacion.component.scss'],
})
export class AsignacionComponent implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  empleados: Empleado[] = [];
  activos: Activo[] = [];
  asignaciones: Asignacion[] = [];
  asignacionesFiltradas: Asignacion[] = [];
  busqueda = '';
  mostrarDialogo = false;
  /** Asignación a editar; `null` = modal en modo alta. */
  asignacionEnEdicion: Asignacion | null = null;
  asignacionDetalle: Asignacion | null = null;
  mostrarDetalleAsignacion = false;
  mostrarConfirmarEliminacion = false;
  asignacionAEliminar: Asignacion | null = null;
  errorAsignacion = '';
  /** Preselección al abrir el modal desde otra pantalla (p. ej. solicitud aprobada). */
  prealtaNuevaAsignacion: { idEmpleado: number; idActivo: number } | null = null;

  constructor(
    private readonly inventario: InventarioService,
    private readonly notificacion: NotificacionService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.inventario.getEmpleados().subscribe((list) => {
      this.empleados = list;
      this.intentarAbrirDialogoPrealta();
    });
    this.inventario.getActivos().subscribe((list) => {
      this.activos = list;
      this.intentarAbrirDialogoPrealta();
    });
    this.inventario.getAsignaciones().subscribe((list) => {
      this.asignaciones = list;
      this.filtrar();
    });
  }

  /** Si la URL trae idEmpleado e idActivo, abre el modal de nueva asignación con preselección. */
  private intentarAbrirDialogoPrealta(): void {
    if (this.mostrarDialogo) {
      return;
    }
    const idEmpleado = this.route.snapshot.queryParamMap.get('idEmpleado');
    const idActivo = this.route.snapshot.queryParamMap.get('idActivo');
    if (!idEmpleado || !idActivo) {
      return;
    }
    if (this.empleados.length === 0 || this.activos.length === 0) {
      return;
    }
    const idE = Number(idEmpleado);
    const idA = Number(idActivo);
    if (!Number.isFinite(idE) || !Number.isFinite(idA)) {
      return;
    }
    const emp = this.empleados.find((e) => e.idEmpleado === idE);
    const act = this.activos.find((a) => a.idActivo === idA);
    if (!emp || !act) {
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
      return;
    }
    this.prealtaNuevaAsignacion = { idEmpleado: idE, idActivo: idA };
    this.errorAsignacion = '';
    this.asignacionEnEdicion = null;
    this.mostrarDialogo = true;
    this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
  }

  iniciales(nombre: string): string {
    if (!nombre?.trim()) return '—';
    const partes = nombre.trim().split(/\s+/);
    if (partes.length >= 2) {
      return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  filtrar(): void {
    const q = this.busqueda?.toLowerCase().trim() ?? '';
    if (!q) {
      this.asignacionesFiltradas = [...this.asignaciones];
      return;
    }
    this.asignacionesFiltradas = this.asignaciones.filter(
      a =>
        a.empleado.nombre.toLowerCase().includes(q) ||
        a.activo.tipo.toLowerCase().includes(q) ||
        a.activo.marca.toLowerCase().includes(q)
    );
  }

  descargarExcel(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    const encabezados = ['Empleado', 'Activo', 'Fecha de asignación', 'Estado'];
    const filas = this.asignacionesFiltradas.map((a) => [
      a.empleado.nombre,
      `${a.activo.tipo} - ${a.activo.marca}`,
      this.formatearFechaCorta(a.fechaAsignacion),
      a.activo.estado ?? '',
    ]);
    const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filas]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Asignaciones');
    const nombre = `asignaciones_${this.timestampArchivo()}.xlsx`;
    XLSX.writeFile(libro, nombre, { bookType: 'xlsx' });
  }

  private formatearFechaCorta(valor: Date | string): string {
    const fecha = new Date(valor);
    if (Number.isNaN(fecha.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(fecha);
  }

  private timestampArchivo(): string {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}_${hh}${mm}`;
  }

  abrirDialogoAsignacion(): void {
    this.asignacionEnEdicion = null;
    this.prealtaNuevaAsignacion = null;
    this.errorAsignacion = '';
    this.mostrarDialogo = true;
  }

  editarAsignacion(asignacion: Asignacion): void {
    this.asignacionEnEdicion = asignacion;
    this.prealtaNuevaAsignacion = null;
    this.errorAsignacion = '';
    this.mostrarDialogo = true;
  }

  verAsignacion(asignacion: Asignacion): void {
    this.asignacionDetalle = asignacion;
    this.mostrarDetalleAsignacion = true;
  }

  cerrarDetalleAsignacion(): void {
    this.mostrarDetalleAsignacion = false;
    this.asignacionDetalle = null;
  }

  onDialogoAsignacionVisible(visible: boolean): void {
    this.mostrarDialogo = visible;
    if (!visible) {
      this.errorAsignacion = '';
      this.asignacionEnEdicion = null;
      this.prealtaNuevaAsignacion = null;
    }
  }

  onAsignacionGuardada(payload: FormNuevaAsignacionModel): void {
    this.errorAsignacion = '';
    const idAsignacion = payload.idAsignacion;
    const esEdicion = idAsignacion != null;
    const peticion =
      esEdicion
        ? this.inventario.updateAsignacion(idAsignacion, {
            empleado: payload.empleado,
            activo: payload.activo,
            fechaAsignacion: payload.fechaAsignacion,
          })
        : this.inventario.addAsignacion({
            empleado: payload.empleado,
            activo: payload.activo,
            fechaAsignacion: payload.fechaAsignacion,
          });

    peticion.subscribe({
      next: () => {
        if (esEdicion) {
          this.notificacion.asignacionActualizada();
        } else {
          this.notificacion.asignacionCreada();
        }
        this.inventario.getAsignaciones().subscribe((list) => {
          this.asignaciones = list;
          this.filtrar();
        });
        this.inventario.getActivos().subscribe((list) => (this.activos = list));
        this.mostrarDialogo = false;
        this.asignacionEnEdicion = null;
        this.prealtaNuevaAsignacion = null;
      },
      error: (err: Error) => {
        this.errorAsignacion = err?.message ?? 'Error al guardar la asignación';
      },
    });
  }

  solicitarEliminarAsignacion(asignacion: Asignacion): void {
    this.asignacionAEliminar = asignacion;
    this.mostrarConfirmarEliminacion = true;
  }

  cancelarEliminarAsignacion(): void {
    this.mostrarConfirmarEliminacion = false;
    this.asignacionAEliminar = null;
  }

  confirmarEliminarAsignacion(): void {
    const asignacion = this.asignacionAEliminar;
    if (!asignacion) {
      return;
    }

    this.errorAsignacion = '';
    this.inventario.deleteAsignacion(asignacion.idAsignacion).subscribe({
      next: () => {
        this.cancelarEliminarAsignacion();
        this.notificacion.asignacionEliminada();
        this.inventario.getAsignaciones().subscribe((list) => {
          this.asignaciones = list;
          this.filtrar();
        });
        this.inventario.getActivos().subscribe((list) => (this.activos = list));
      },
      error: (err: Error) => {
        this.cancelarEliminarAsignacion();
        this.errorAsignacion = err?.message ?? 'Error al eliminar la asignación';
        this.notificacion.error(this.errorAsignacion, 'No se pudo eliminar');
      },
    });
  }
}
