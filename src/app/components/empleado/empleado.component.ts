import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InventarioService } from '../../application/use-cases/inventario.service';
import { AuthService } from '../../application/use-cases/auth.service';
import { NotificacionService } from '../../core/services/notificacion.service';
import { Empleado } from '../../domain';
import {
  FormNuevoEmpleadoComponent,
  FormNuevoEmpleadoModel,
} from './form-nuevo-empleado/form-nuevo-empleado.component';
import { CapitalizeFirstDirective } from '../../shared/directives/capitalize-first.directive';

@Component({
  selector: 'app-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    FormNuevoEmpleadoComponent,
    CapitalizeFirstDirective,
  ],
  templateUrl: './empleado.component.html',
  styleUrls: ['./empleado.component.scss'],
})
export class EmpleadoComponent implements OnInit {
  empleados: Empleado[] = [];
  empleadosFiltrados: Empleado[] = [];
  busqueda = '';
  mostrarDialogo = false;
  /** Empleado a editar; `null` = modal en modo alta. */
  empleadoEnEdicion: Empleado | null = null;
  empleadoDetalle: Empleado | null = null;
  mostrarDetalleEmpleado = false;
  /** Estado visual local de activación por empleado. */
  private estadoEmpleadoPorId = new Map<number, boolean>();
  mostrarCredencialesFuncionario = false;
  credencialesFuncionario = {
    username: '',
    password: '',
    creado: false,
  };

  constructor(
    private readonly inventario: InventarioService,
    private readonly auth: AuthService,
    private readonly notificacion: NotificacionService,
  ) {}

  ngOnInit(): void {
    this.inventario.getEmpleados().subscribe(list => {
      this.empleados = list;
      this.sincronizarEstados(list);
      this.filtrar();
    });
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
      this.empleadosFiltrados = [...this.empleados];
      return;
    }
    this.empleadosFiltrados = this.empleados.filter(
      e =>
        e.nombre.toLowerCase().includes(q) ||
        e.cargo.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q)
    );
  }

  abrirDialogoEmpleado(): void {
    this.empleadoEnEdicion = null;
    this.mostrarDialogo = true;
  }

  editarEmpleado(empleado: Empleado): void {
    this.empleadoEnEdicion = empleado;
    this.mostrarDialogo = true;
  }

  verEmpleado(empleado: Empleado): void {
    this.empleadoDetalle = empleado;
    this.mostrarDetalleEmpleado = true;
  }

  cerrarDetalleEmpleado(): void {
    this.mostrarDetalleEmpleado = false;
    this.empleadoDetalle = null;
  }

  onDialogoEmpleadoVisible(visible: boolean): void {
    this.mostrarDialogo = visible;
    if (!visible) {
      this.empleadoEnEdicion = null;
    }
  }

  onEmpleadoGuardado(payload: FormNuevoEmpleadoModel): void {
    const id =
      payload.idEmpleado == null ? NaN : Number(payload.idEmpleado);
    const esEdicion = Number.isFinite(id) && id > 0;

    const peticion = esEdicion
      ? this.inventario.updateEmpleado(id, {
          nombre: payload.nombre,
          cargo: payload.cargo,
          area: payload.area,
        })
      : this.inventario.addEmpleado({
          nombre: payload.nombre,
          cargo: payload.cargo,
          area: payload.area,
        });

    peticion.subscribe({
      next: (empleadoGuardado) => {
        if (esEdicion) {
          this.notificacion.empleadoActualizado();
        } else {
          this.notificacion.empleadoCreado();
          const credenciales = this.auth.ensureFuncionarioAccount(empleadoGuardado);
          if (credenciales) {
            this.credencialesFuncionario = { ...credenciales };
            this.mostrarCredencialesFuncionario = true;
          }
        }
        this.inventario.getEmpleados().subscribe((list) => {
          this.empleados = list;
          this.sincronizarEstados(list);
          this.filtrar();
        });
        this.mostrarDialogo = false;
        this.empleadoEnEdicion = null;
      },
      error: (err: Error) =>
        this.notificacion.error(
          err?.message ??
            (esEdicion
              ? 'No se pudo actualizar el empleado. Comprueba que el API esté en marcha.'
              : 'No se pudo crear el empleado. Comprueba que el API esté en marcha.'),
          esEdicion ? 'Error al actualizar empleado' : 'Error al crear empleado',
        ),
    });
  }

  estaActivo(empleado: Empleado): boolean {
    const estado = this.estadoEmpleadoPorId.get(empleado.idEmpleado);
    return estado ?? true;
  }

  cambiarEstadoEmpleado(empleado: Empleado, activo: boolean): void {
    const estadoPrevio = this.estaActivo(empleado);
    this.estadoEmpleadoPorId.set(empleado.idEmpleado, activo);
    this.inventario
      .updateEmpleado(empleado.idEmpleado, {
        nombre: empleado.nombre,
        cargo: empleado.cargo,
        area: empleado.area,
        activo,
      })
      .subscribe({
        next: (actualizado) => {
          empleado.activo = actualizado.activo ?? activo;
          this.estadoEmpleadoPorId.set(empleado.idEmpleado, empleado.activo ?? true);
          if (activo) {
            this.notificacion.empleadoActivado(empleado.nombre);
          } else {
            this.notificacion.empleadoDesactivado(empleado.nombre);
          }
        },
        error: (err: Error) => {
          this.estadoEmpleadoPorId.set(empleado.idEmpleado, estadoPrevio);
          this.notificacion.error(
            err?.message ?? 'No se pudo actualizar el estado del empleado.',
            'Error al cambiar estado',
          );
        },
      });
  }

  private sincronizarEstados(list: Empleado[]): void {
    const siguiente = new Map<number, boolean>();
    for (const empleado of list) {
      const activoBackend = empleado.activo ?? true;
      siguiente.set(empleado.idEmpleado, activoBackend);
    }
    this.estadoEmpleadoPorId = siguiente;
  }

  cerrarModalCredenciales(): void {
    this.mostrarCredencialesFuncionario = false;
  }
}
