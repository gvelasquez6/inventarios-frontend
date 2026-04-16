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
import { Activo, EstadoActivo } from '../../../domain';
import { CapitalizeFirstDirective } from '../../../shared/directives/capitalize-first.directive';

function idActivoDesde(a: Activo & { id_activo?: number }): number | undefined {
  const raw = a.idActivo ?? a.id_activo;
  if (raw == null) {
    return undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export interface FormNuevoActivoModel {
  tipo: string;
  marca: string;
  modelo: string;
  serial: string;
  estado: string;
}

@Component({
  selector: 'app-form-nuevo-activo',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
    CapitalizeFirstDirective,
  ],
  templateUrl: './form-nuevo-activo.component.html',
  styleUrls: ['./form-nuevo-activo.component.scss'],
})
export class FormNuevoActivoComponent implements OnChanges {
  @Input() visible = false;
  @Input() activoEditar: Activo | null = null;
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() submitForm = new EventEmitter<Partial<Activo>>();

  @ViewChild('formActivo') formActivoRef!: NgForm;

  form: FormNuevoActivoModel = {
    tipo: '',
    marca: '',
    modelo: '',
    serial: '',
    estado: '',
  };

  /**
   * Id en edición; no en `form` porque `NgForm.resetForm` solo aplica controles con ngModel
   * y podría perderse el id usado para el PUT.
   */
  private idActivoEdicion: number | null = null;

  estados = [
    { label: 'Disponible', value: 'DISPONIBLE' },
    { label: 'Asignado', value: 'ASIGNADO' },
    { label: 'Mantenimiento', value: 'MANTENIMIENTO' },
    { label: 'Baja', value: 'BAJA' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.visible) {
      return;
    }
    if (changes['visible'] || changes['activoEditar']) {
      this.sincronizarConModo();
    }
  }

  get tituloDialogo(): string {
    return this.activoEditar ? 'Editar activo' : 'Registrar nuevo activo';
  }

  get etiquetaBotonEnviar(): string {
    return this.activoEditar ? 'Guardar cambios' : 'Agregar activo';
  }

  cerrar(): void {
    this.resetForm();
    this.visibleChange.emit(false);
  }

  enviar(): void {
    if (!this.formActivoRef || this.formActivoRef.invalid) {
      this.formActivoRef?.form.markAllAsTouched();
      return;
    }
    const base: Partial<Activo> = {
      tipo: this.form.tipo.trim(),
      marca: this.form.marca.trim(),
      modelo: this.form.modelo.trim(),
      serial: this.form.serial.trim(),
      estado: this.form.estado as EstadoActivo,
    };
    if (this.idActivoEdicion != null) {
      this.submitForm.emit({ ...base, idActivo: this.idActivoEdicion });
    } else {
      this.submitForm.emit(base);
    }
    this.resetForm();
    this.visibleChange.emit(false);
  }

  private sincronizarConModo(): void {
    if (this.activoEditar) {
      const a = this.activoEditar;
      this.idActivoEdicion = idActivoDesde(a as Activo & { id_activo?: number }) ?? null;
      this.form = {
        tipo: a.tipo,
        marca: a.marca,
        modelo: a.modelo,
        serial: a.serial,
        estado: a.estado,
      };
      queueMicrotask(() =>
        this.formActivoRef?.resetForm({
          tipo: this.form.tipo,
          marca: this.form.marca,
          modelo: this.form.modelo,
          serial: this.form.serial,
          estado: this.form.estado,
        }),
      );
    } else {
      this.resetForm();
    }
  }

  private resetForm(): void {
    this.idActivoEdicion = null;
    const vacio: FormNuevoActivoModel = {
      tipo: '',
      marca: '',
      modelo: '',
      serial: '',
      estado: '',
    };
    this.form = vacio;
    queueMicrotask(() => this.formActivoRef?.resetForm(vacio));
  }
}
