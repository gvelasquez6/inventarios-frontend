import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InventarioService } from '../../application/use-cases/inventario.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Activo, Asignacion, Empleado } from '../../domain';
import { FormNuevoActivoComponent } from './form-nuevo-activo/form-nuevo-activo.component';
import { CapitalizeFirstDirective } from '../../shared/directives/capitalize-first.directive';

@Component({
  selector: 'app-activo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    DialogModule,
    FormNuevoActivoComponent,
    CapitalizeFirstDirective,
  ],
  templateUrl: './activo.component.html',
  styleUrls: ['./activo.component.scss'],
})
export class ActivoComponent implements OnInit {
  activos: Activo[] = [];
  activosFiltrados: Activo[] = [];
  busqueda = '';
  estadoFiltro: string | null = null;
  mostrarDialogo = false;
  activoEnEdicion: Activo | null = null;
  activoDetalle: Activo | null = null;
  funcionarioAsignadoDetalle: Empleado | null = null;
  mostrarDetalleActivo = false;
  private asignaciones: Asignacion[] = [];

  opcionesEstado = [
    { label: 'Todos', value: '' },
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Asignado', value: 'ASIGNADO' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
    { label: 'Baja', value: 'BAJA' },
  ];

  constructor(
    private readonly inventario: InventarioService,
    private readonly notificacion: NotificacionService,
  ) {}

  ngOnInit(): void {
    this.inventario.getActivos().subscribe(list => {
      this.activos = list;
      this.filtrar();
    });
    this.inventario.getAsignaciones().subscribe((list) => {
      this.asignaciones = list;
    });
  }

  filtrar(): void {
    let list = [...this.activos];
    const q = this.busqueda?.toLowerCase().trim() ?? '';
    if (q) {
      list = list.filter(
        a =>
          a.tipo.toLowerCase().includes(q) ||
          a.marca.toLowerCase().includes(q) ||
          a.modelo.toLowerCase().includes(q) ||
          a.serial.toLowerCase().includes(q)
      );
    }
    if (this.estadoFiltro != null) {
      list = list.filter(a => a.estado === this.estadoFiltro);
    }
    this.activosFiltrados = list;
  }

  abrirDialogoNuevo(): void {
    this.activoEnEdicion = null;
    this.mostrarDialogo = true;
  }

  abrirDialogoEditar(activo: Activo): void {
    this.activoEnEdicion = activo;
    this.mostrarDialogo = true;
  }

  verActivo(activo: Activo): void {
    this.activoDetalle = activo;
    this.funcionarioAsignadoDetalle = this.obtenerFuncionarioAsignado(activo.idActivo);
    this.mostrarDetalleActivo = true;
  }

  cerrarDetalleActivo(): void {
    this.mostrarDetalleActivo = false;
    this.activoDetalle = null;
    this.funcionarioAsignadoDetalle = null;
  }

  onDialogoActivoVisible(visible: boolean): void {
    this.mostrarDialogo = visible;
    if (!visible) {
      this.activoEnEdicion = null;
    }
  }

  onActivoAgregado(payload: Partial<Activo>): void {
    const id =
      payload.idActivo == null ? NaN : Number(payload.idActivo);
    const esEdicion = Number.isFinite(id) && id > 0;

    if (esEdicion) {
      const patch: Partial<Activo> = { ...payload };
      delete patch.idActivo;
      this.inventario.updateActivo(id, patch).subscribe({
        next: () => {
          this.notificacion.activoActualizado();
          this.refrescarActivos();
        },
        error: () =>
          this.notificacion.error(
            'No se pudo guardar el activo. Comprueba que el API esté en marcha.',
            'Error al guardar',
          ),
      });
    } else {
      this.inventario.addActivo(payload).subscribe({
        next: () => {
          this.notificacion.activoCreado();
          this.refrescarActivos();
        },
        error: () =>
          this.notificacion.error(
            'No se pudo crear el activo. Comprueba que el API esté en marcha.',
            'Error al crear',
          ),
      });
    }
  }

  private refrescarActivos(): void {
    this.inventario.getActivos().subscribe((list) => {
      this.activos = list;
      this.filtrar();
    });
  }

  private obtenerFuncionarioAsignado(idActivo: number): Empleado | null {
    const candidatas = this.asignaciones.filter((a) => Number(a.activo?.idActivo) === Number(idActivo));
    if (candidatas.length === 0) {
      return null;
    }

    const activas = candidatas.filter((a) => {
      const estado = (a.estado ?? '').trim().toUpperCase();
      const sinDevolucion = !a.fechaDevolucion;
      return sinDevolucion || estado === 'ACTIVA' || estado === 'ASIGNADA' || estado === 'VIGENTE';
    });

    const fuente = activas.length > 0 ? activas : candidatas;
    const ordenadas = [...fuente].sort(
      (a, b) => new Date(b.fechaAsignacion).getTime() - new Date(a.fechaAsignacion).getTime(),
    );

    return ordenadas[0]?.empleado ?? null;
  }
}
