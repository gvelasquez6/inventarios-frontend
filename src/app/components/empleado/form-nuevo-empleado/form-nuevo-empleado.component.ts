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
import { CapitalizeFirstDirective } from '../../../shared/directives/capitalize-first.directive';
import { Empleado } from '../../../domain';

function idEmpleadoDesde(e: Empleado & { id_empleado?: number }): number | undefined {
  const raw = e.idEmpleado ?? e.id_empleado;
  if (raw == null) {
    return undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export interface FormNuevoEmpleadoModel {
  nombre: string;
  cargo: string;
  area: string;
  /** Si viene definido, el padre debe llamar a actualizar en lugar de crear. */
  idEmpleado?: number;
}

@Component({
  selector: 'app-form-nuevo-empleado',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CapitalizeFirstDirective,
  ],
  templateUrl: './form-nuevo-empleado.component.html',
  styleUrls: ['./form-nuevo-empleado.component.scss'],
})
export class FormNuevoEmpleadoComponent implements OnChanges {
  @Input() visible = false;
  @Output() visibleChange = new EventEmitter<boolean>();
  /** Si se indica, el formulario carga datos para edición. */
  @Input() empleadoEditar: Empleado | null = null;
  @Output() submitForm = new EventEmitter<FormNuevoEmpleadoModel>();

  @ViewChild('formEmpleado') formEmpleadoRef!: NgForm;

  form: FormNuevoEmpleadoModel = {
    nombre: '',
    cargo: '',
    area: '',
  };

  /**
   * Id del empleado en edición; no va en `form` porque `NgForm.resetForm` solo aplica
   * controles con ngModel y borraría `idEmpleado` del modelo.
   */
  private idEmpleadoEdicion: number | null = null;

  cargos = [
    { label: 'Analista', value: 'Analista' },
    { label: 'Coordinador', value: 'Coordinador' },
    { label: 'Gerente', value: 'Gerente' },
  ];

  areas = [
    { label: 'TI', value: 'TI' },
    { label: 'Administración', value: 'Administración' },
    { label: 'RR.HH.', value: 'RR.HH.' },
  ];

  get tituloDialogo(): string {
    return this.empleadoEditar ? 'Editar empleado' : 'Registrar nuevo empleado';
  }

  get etiquetaBotonEnviar(): string {
    return this.empleadoEditar ? 'Guardar cambios' : 'Agregar empleado';
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      return;
    }
    if (changes['visible'] || changes['empleadoEditar']) {
      if (this.empleadoEditar) {
        this.aplicarEdicion(this.empleadoEditar);
      } else {
        this.resetForm();
      }
    }
  }

  private aplicarEdicion(e: Empleado): void {
    this.idEmpleadoEdicion = idEmpleadoDesde(e as Empleado & { id_empleado?: number }) ?? null;
    this.form = {
      nombre: e.nombre ?? '',
      cargo: e.cargo ?? '',
      area: e.area ?? '',
    };
    queueMicrotask(() =>
      this.formEmpleadoRef?.resetForm({
        nombre: this.form.nombre,
        cargo: this.form.cargo,
        area: this.form.area,
      }),
    );
  }

  cerrar(): void {
    this.resetForm();
    this.visibleChange.emit(false);
  }

  enviar(): void {
    if (!this.formEmpleadoRef || this.formEmpleadoRef.invalid) {
      this.formEmpleadoRef?.form.markAllAsTouched();
      return;
    }
    const payload: FormNuevoEmpleadoModel = {
      nombre: this.form.nombre.trim(),
      cargo: this.form.cargo,
      area: this.form.area,
    };
    if (this.idEmpleadoEdicion != null) {
      payload.idEmpleado = this.idEmpleadoEdicion;
    }
    this.submitForm.emit(payload);
    this.resetForm();
    this.visibleChange.emit(false);
  }

  private resetForm(): void {
    this.idEmpleadoEdicion = null;
    const vacio: FormNuevoEmpleadoModel = {
      nombre: '',
      cargo: '',
      area: '',
    };
    this.form = vacio;
    queueMicrotask(() => this.formEmpleadoRef?.resetForm(vacio));
  }
}
