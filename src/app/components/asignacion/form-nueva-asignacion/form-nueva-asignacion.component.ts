import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { AutoCompleteModule } from 'primeng/autocomplete';
import { Activo, Asignacion, Empleado } from '../../../domain';

export interface FormNuevaAsignacionModel {
  empleado: Empleado;
  activo: Activo;
  fechaAsignacion: Date;
  /** Si viene definido, el padre debe llamar a actualizar en lugar de crear. */
  idAsignacion?: number;
}

@Component({
  selector: 'app-form-nueva-asignacion',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    AutoCompleteModule,
  ],
  templateUrl: './form-nueva-asignacion.component.html',
  styleUrls: ['./form-nueva-asignacion.component.scss'],
})
export class FormNuevaAsignacionComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Input() empleados: Empleado[] = [];
  @Input() activos: Activo[] = [];
  /** Si se indica, el formulario carga datos para edición. */
  @Input() asignacionEditar: Asignacion | null = null;
  /** Preselección al abrir alta (p. ej. desde solicitud): empleado y activo por id. */
  @Input() prealtaIds: { idEmpleado: number; idActivo: number } | null = null;
  /** Error devuelto por el padre tras intentar guardar (p. ej. reglas de negocio) */
  @Input() errorAsignacion = '';
  @Output() submitForm = new EventEmitter<FormNuevaAsignacionModel>();

  @ViewChild('formAsignacion') formAsignacionRef!: NgForm;

  form: {
    empleado: Empleado | null;
    activo: Activo | null;
    fechaAsignacion: string;
    estadoActivo: string;
    motivoMantenimiento: string;
    observaciones: string;
  } = {
    empleado: null,
    activo: null,
    fechaAsignacion: '',
    estadoActivo: '',
    motivoMantenimiento: '',
    observaciones: '',
  };

  empleadosFiltrados: Empleado[] = [];
  activosFiltrados: Activo[] = [];

  /** Fecha + hora que se enviarán y se muestran (día elegido + hora al seleccionar). */
  fechaHoraAsignacion: Date | null = null;
  errorFechaPasada = false;
  /** Evita reaplicar prealta al refrescar listas de empleados/activos con el modal abierto. */
  private prealtaAplicada = false;

  get fechaMinima(): string {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  get tituloDialogo(): string {
    return this.asignacionEditar ? 'Editar asignación' : 'Registrar nueva asignación';
  }

  get etiquetaBotonEnviar(): string {
    return this.asignacionEditar ? 'Guardar cambios' : 'Agregar asignación';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !changes['visible'].currentValue) {
      this.prealtaAplicada = false;
    }
    if (changes['prealtaIds']) {
      this.prealtaAplicada = false;
    }
    if (!this.visible) {
      return;
    }
    if (this.asignacionEditar && (changes['visible'] || changes['asignacionEditar'])) {
      this.aplicarEdicion(this.asignacionEditar);
    } else if (
      this.prealtaIds &&
      this.empleados.length > 0 &&
      this.activos.length > 0 &&
      !this.prealtaAplicada &&
      (changes['visible'] ||
        changes['prealtaIds'] ||
        changes['empleados'] ||
        changes['activos'])
    ) {
      this.aplicarPrealtaDesdeIds();
      this.prealtaAplicada = true;
    } else if (
      (changes['visible'] || changes['asignacionEditar'] || changes['prealtaIds']) &&
      !this.asignacionEditar &&
      !this.prealtaIds
    ) {
      this.limpiarFormulario();
    }
    if (changes['activos'] && this.visible) {
      this.filtrarActivos({ query: '' });
    }
    if (changes['empleados'] && this.visible) {
      this.filtrarEmpleados({ query: '' });
    }
  }

  /**
   * Al elegir día en el datepicker, combina esa fecha con la hora actual
   * y actualiza el resumen visible para el usuario.
   */
  onFechaAsignacionElegida(fechaIsoDate: string): void {
    this.errorFechaPasada = false;
    if (!fechaIsoDate?.trim()) {
      this.fechaHoraAsignacion = null;
      return;
    }
    this.fechaHoraAsignacion = this.combinarFechaElegidaConHoraActual(fechaIsoDate);
  }

  private combinarFechaElegidaConHoraActual(fechaIsoDate: string): Date {
    const [y, m, d] = fechaIsoDate.split('-').map(Number);
    const ahora = new Date();
    return new Date(y, m - 1, d, ahora.getHours(), ahora.getMinutes(), ahora.getSeconds(), ahora.getMilliseconds());
  }

  private aplicarEdicion(a: Asignacion): void {
    const d =
      a.fechaAsignacion instanceof Date
        ? a.fechaAsignacion
        : new Date(a.fechaAsignacion as unknown as string);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    this.form = {
      empleado: { ...a.empleado },
      activo: { ...a.activo },
      fechaAsignacion: `${y}-${mo}-${day}`,
      estadoActivo: a.activo.estado,
      motivoMantenimiento: '',
      observaciones: '',
    };
    this.fechaHoraAsignacion = new Date(d);
    queueMicrotask(() =>
      this.formAsignacionRef?.resetForm({
        empleado: this.form.empleado,
        activo: this.form.activo,
        fechaAsignacion: this.form.fechaAsignacion,
        estadoActivo: this.form.estadoActivo,
        motivoMantenimiento: this.form.motivoMantenimiento,
        observaciones: this.form.observaciones,
      }),
    );
  }

  private limpiarFormulario(): void {
    this.errorFechaPasada = false;
    this.fechaHoraAsignacion = null;
    this.form = {
      empleado: null,
      activo: null,
      fechaAsignacion: '',
      estadoActivo: '',
      motivoMantenimiento: '',
      observaciones: '',
    };
    queueMicrotask(() =>
      this.formAsignacionRef?.resetForm({
        empleado: null,
        activo: null,
        fechaAsignacion: '',
        estadoActivo: '',
        motivoMantenimiento: '',
        observaciones: '',
      }),
    );
  }

  private aplicarPrealtaDesdeIds(): void {
    if (!this.prealtaIds) {
      return;
    }
    const emp = this.empleados.find((e) => e.idEmpleado === this.prealtaIds!.idEmpleado);
    const act = this.activos.find((a) => a.idActivo === this.prealtaIds!.idActivo);
    if (!emp || !act) {
      return;
    }
    const hoy = new Date();
    const y = hoy.getFullYear();
    const mo = String(hoy.getMonth() + 1).padStart(2, '0');
    const day = String(hoy.getDate()).padStart(2, '0');
    const fechaIso = `${y}-${mo}-${day}`;
    this.errorFechaPasada = false;
    this.form = {
      empleado: { ...emp },
      activo: { ...act },
      fechaAsignacion: fechaIso,
      estadoActivo: act.estado,
      motivoMantenimiento: '',
      observaciones: '',
    };
    this.fechaHoraAsignacion = this.combinarFechaElegidaConHoraActual(fechaIso);
    queueMicrotask(() => {
      this.formAsignacionRef?.resetForm({
        empleado: this.form.empleado,
        activo: this.form.activo,
        fechaAsignacion: this.form.fechaAsignacion,
        estadoActivo: this.form.estadoActivo,
        motivoMantenimiento: this.form.motivoMantenimiento,
        observaciones: this.form.observaciones,
      });
      this.filtrarEmpleados({ query: '' });
      this.filtrarActivos({ query: '' });
    });
  }

  onActivoSeleccionado(activo: Activo | null): void {
    this.form.estadoActivo = activo?.estado ?? '';
  }

  filtrarEmpleados(event: { query: string }): void {
    const query = event.query.toLowerCase();
    this.empleadosFiltrados = this.empleados.filter((e) =>
      e.nombre.toLowerCase().includes(query),
    );
  }

  filtrarActivos(event: { query: string }): void {
    const query = (event.query ?? '').toLowerCase().trim();
    const idActivoEdicion = this.idActivo(this.asignacionEditar?.activo);
    this.activosFiltrados = this.activos.filter(
      (a) =>
        this.coincideActivo(a, query) &&
        (a.estado === 'DISPONIBLE' ||
          (idActivoEdicion != null && this.idActivo(a) === idActivoEdicion)),
    );
  }

  private coincideActivo(a: Activo, query: string): boolean {
    if (!query) {
      return true;
    }
    const tipo = (a.tipo ?? '').toLowerCase();
    const marca = (a.marca ?? '').toLowerCase();
    const modelo = (a.modelo ?? '').toLowerCase();
    const serial = (a.serial ?? '').toLowerCase();
    return (
      tipo.includes(query) ||
      marca.includes(query) ||
      modelo.includes(query) ||
      serial.includes(query)
    );
  }

  private idActivo(activo: (Activo & { id_activo?: number }) | null | undefined): number | null {
    const raw = activo?.idActivo ?? activo?.id_activo;
    if (raw == null) {
      return null;
    }
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  cerrar(): void {
    this.limpiarFormulario();
    this.visibleChange.emit(false);
  }

  enviar(): void {
    this.errorFechaPasada = false;
    if (!this.formAsignacionRef || this.formAsignacionRef.invalid) {
      this.formAsignacionRef?.form.markAllAsTouched();
      return;
    }
    const empleado = this.form.empleado;
    const activo = this.form.activo;
    const fechaAsignacion =
      this.fechaHoraAsignacion ??
      (this.form.fechaAsignacion
        ? this.combinarFechaElegidaConHoraActual(this.form.fechaAsignacion)
        : null);
    if (!empleado || !activo || !fechaAsignacion) {
      return;
    }
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioFechaAsignacion = new Date(
      fechaAsignacion.getFullYear(),
      fechaAsignacion.getMonth(),
      fechaAsignacion.getDate(),
    );
    if (inicioFechaAsignacion < inicioHoy) {
      this.errorFechaPasada = true;
      return;
    }
    const payload: FormNuevaAsignacionModel = {
      empleado,
      activo,
      fechaAsignacion,
    };
    if (this.asignacionEditar != null) {
      payload.idAsignacion = this.asignacionEditar.idAsignacion;
    }
    this.submitForm.emit(payload);
  }
}
